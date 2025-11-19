#![allow(deprecated)]
#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod states;

use instructions::*;
use states::reaction::ReactionType;

declare_id!("5aQmhcFhVmgtmCdGtffRuMYL9R1WsARAtukzxUttPKKN");

#[program]
pub mod depress {
    use super::*;

    // pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    //     msg!("Greetings from: {:?}", ctx.program_id);
    //     Ok(())
    // }

    pub fn post_add(
        ctx: Context<AddPostContext>,
        post_topic: String,
        post_content: String,
    ) -> Result<()> {
        add_post(ctx, post_topic, post_content)
    }

    pub fn post_remove(ctx: Context<RemovePostContext>) -> Result<()> {
        remove_post(ctx)
    }

    pub fn like_post(ctx: Context<AddReactionPostContext>) -> Result<()> {
        add_reaction_post(ctx, ReactionType::Like)
    }

    pub fn dislike_post(ctx: Context<AddReactionPostContext>) -> Result<()> {
        add_reaction_post(ctx, ReactionType::Dislike)
    }

    pub fn reaction_remove_post(ctx: Context<RemoveReactionPostContext>) -> Result<()> {
        remove_reaction_post(ctx)
    }

    pub fn comment_add(ctx: Context<AddCommentContext>, comment_content: String) -> Result<()> {
        add_comment(ctx, comment_content)
    }
    pub fn comment_remove(ctx: Context<RemoveCommentContext>) -> Result<()> {
        remove_comment(ctx)
    }

    pub fn like_comment(ctx: Context<AddReactionCommentContext>) -> Result<()> {
        add_reaction_comment(ctx, ReactionType::Like)
    }

    pub fn dislike_comment(ctx: Context<AddReactionCommentContext>) -> Result<()> {
        add_reaction_comment(ctx, ReactionType::Dislike)
    }

    pub fn reaction_remove_comment(ctx: Context<RemoveReactionCommentContext>) -> Result<()> {
        remove_reaction_comment(ctx)
    }
}
