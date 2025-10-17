#![allow(unexpected_cfgs)]
#![allow(unused)]

#[cfg(test)]
mod tests {
    use {
        anchor_lang::{
            error::Error,
            prelude::{msg, AccountMeta},
            solana_program::{
                hash::Hash, native_token::LAMPORTS_PER_SOL, program_pack::Pack, pubkey::Pubkey,
            },
            system_program::ID as SYSTEM_PROGRAM_ID,
            AccountDeserialize, InstructionData, Key, ToAccountMetas,
        },
        litesvm::LiteSVM,
        solana_address::Address,
        solana_hash::Hash as SolanaHash,
        solana_instruction::Instruction,
        solana_keypair::Keypair,
        solana_signer::Signer,
        solana_transaction::Transaction,
        std::{path::PathBuf, str::FromStr},
    };

    pub struct ReusableState {}

    pub fn setup() {}
}
