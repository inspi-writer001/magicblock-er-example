import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { GetCommitmentSignature } from "@magicblock-labs/ephemeral-rollups-sdk";
import { ErStateAccount } from "../target/types/er_state_account";

describe("er-state-account", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const providerEphemeralRollup = new anchor.AnchorProvider(
    new anchor.web3.Connection(process.env.EPHEMERAL_PROVIDER_ENDPOINT || "https://devnet.magicblock.app/", {wsEndpoint: process.env.EPHEMERAL_WS_ENDPOINT || "wss://devnet.magicblock.app/"}
    ),
    anchor.Wallet.local()
  );
  console.log("Base Layer Connection: ", provider.connection.rpcEndpoint);
  console.log("Ephemeral Rollup Connection: ", providerEphemeralRollup.connection.rpcEndpoint);
  console.log(`Current SOL Public Key: ${anchor.Wallet.local().publicKey}`)

  before(async function () {
    const balance = await provider.connection.getBalance(anchor.Wallet.local().publicKey)
    console.log('Current balance is', balance / LAMPORTS_PER_SOL, ' SOL','\n')
  })

  const program = anchor.workspace.erStateAccount as Program<ErStateAccount>;

  const userAccount = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user-account"), anchor.Wallet.local().publicKey.toBuffer()],
    program.programId
  )[0];

  xit("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accountsPartial({
      user: anchor.Wallet.local().publicKey,
      userAccount: userAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    console.log("User Account initialized: ", tx);
  });

  xit("Update State!", async () => {
    const tx = await program.methods.update(new anchor.BN(42)).accountsPartial({
      user: anchor.Wallet.local().publicKey,
      userAccount: userAccount,
    })
    .rpc();
    console.log("\nUser Account State Updated: ", tx);
  });

  xit("Delegate to Ephemeral Rollup!", async () => {

    let tx = await program.methods.delegate().accountsPartial({
      user: anchor.Wallet.local().publicKey,
      userAccount: userAccount,
      validator: new PublicKey("MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e"),
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc({skipPreflight: true});

    console.log("\nUser Account Delegated to Ephemeral Rollup: ", tx);
  });

  it("Update State and Commit to Base Layer!", async () => {
    let tx = await program.methods.updateCommit(new anchor.BN(43)).accountsPartial({
      user: providerEphemeralRollup.wallet.publicKey,
      userAccount: userAccount,
    })
    .transaction();

    tx.feePayer = providerEphemeralRollup.wallet.publicKey;

    tx.recentBlockhash = (await providerEphemeralRollup.connection.getLatestBlockhash()).blockhash;
    tx = await providerEphemeralRollup.wallet.signTransaction(tx);
    const txHash = await providerEphemeralRollup.sendAndConfirm(tx, [], {skipPreflight: false});
    const txCommitSgn = await GetCommitmentSignature(
      txHash,
      providerEphemeralRollup.connection
  );

    console.log("\nUser Account State Updated: ", txHash);
  });

  it("Commit and undelegate from Ephemeral Rollup!", async () => {
    let info = await providerEphemeralRollup.connection.getAccountInfo(userAccount);

    console.log("User Account Info: ", info);

    console.log("User account", userAccount.toBase58());

    let tx = await program.methods.undelegate().accounts({
      user: providerEphemeralRollup.wallet.publicKey,
    })
    .transaction();

    tx.feePayer = providerEphemeralRollup.wallet.publicKey;

    tx.recentBlockhash = (await providerEphemeralRollup.connection.getLatestBlockhash()).blockhash;
    tx = await providerEphemeralRollup.wallet.signTransaction(tx);
    const txHash = await providerEphemeralRollup.sendAndConfirm(tx, [], {skipPreflight: false});
    const txCommitSgn = await GetCommitmentSignature(
      txHash,
      providerEphemeralRollup.connection
  );

    console.log("\nUser Account Undelegated: ", txHash);
  });

  xit("Update State!", async () => {
    let tx = await program.methods.update(new anchor.BN(45)).accountsPartial({
      user: anchor.Wallet.local().publicKey,
      userAccount: userAccount,
    })
    .transaction();

    tx.feePayer = anchor.Wallet.local().publicKey;

    const latestBlockhash = await providerEphemeralRollup.connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx = await providerEphemeralRollup.wallet.signTransaction(tx);
    const txHash = await providerEphemeralRollup.sendAndConfirm(tx);
    tx.feePayer = provider.wallet.publicKey;
    const txCommitSgn = await GetCommitmentSignature(
      txHash,
      providerEphemeralRollup.connection
  );

    console.log("\nUser Account State Updated: ", tx);
  });

  xit("Close Account!", async () => {
    const tx = await program.methods.close().accountsPartial({
      user: anchor.Wallet.local().publicKey,
      userAccount: userAccount,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
    console.log("\nUser Account Closed: ", tx);
  });
});
