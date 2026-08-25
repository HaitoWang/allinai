package service

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPreserveOpenAITeamCredentialOverrides_ExplicitMarker(t *testing.T) {
	account := &Account{
		Platform: PlatformOpenAI,
		Type:     AccountTypeOAuth,
		Credentials: map[string]any{
			"plan_type":          "team",
			"chatgpt_account_id": "workspace-old",
		},
		Extra: map[string]any{
			OpenAITeamRotationManagedExtraKey: true,
			OpenAITeamWorkspaceIDExtraKey:     "workspace-team",
			OpenAITeamPlanTypeExtraKey:        "team",
		},
	}
	refreshed := map[string]any{
		"access_token":       "fresh-token",
		"plan_type":          "free",
		"chatgpt_account_id": "personal-account",
	}

	got := PreserveOpenAITeamCredentialOverrides(account, refreshed)

	require.Equal(t, "team", got["plan_type"])
	require.Equal(t, "workspace-team", got["chatgpt_account_id"])
	require.Equal(t, "fresh-token", got["access_token"])
}

func TestPreserveOpenAITeamCredentialOverrides_LegacyTeamAccount(t *testing.T) {
	account := &Account{
		Platform: PlatformOpenAI,
		Type:     AccountTypeOAuth,
		Credentials: map[string]any{
			"plan_type":          "team",
			"chatgpt_account_id": "workspace-legacy",
		},
	}
	refreshed := map[string]any{
		"plan_type":          "free",
		"chatgpt_account_id": "personal-account",
	}

	got := PreserveOpenAITeamCredentialOverrides(account, refreshed)

	require.Equal(t, "team", got["plan_type"])
	require.Equal(t, "workspace-legacy", got["chatgpt_account_id"])
}

func TestPreserveOpenAITeamCredentialOverrides_LeavesPersonalAccountAlone(t *testing.T) {
	account := &Account{
		Platform: PlatformOpenAI,
		Type:     AccountTypeOAuth,
		Credentials: map[string]any{
			"plan_type":          "free",
			"chatgpt_account_id": "personal-old",
		},
	}
	refreshed := map[string]any{
		"plan_type":          "plus",
		"chatgpt_account_id": "personal-new",
	}

	got := PreserveOpenAITeamCredentialOverrides(account, refreshed)

	require.Equal(t, "plus", got["plan_type"])
	require.Equal(t, "personal-new", got["chatgpt_account_id"])
}
