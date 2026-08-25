package service

import "strings"

const (
	OpenAITeamRotationManagedExtraKey = "openai_team_rotation_managed"
	OpenAITeamWorkspaceIDExtraKey     = "openai_team_workspace_id"
	OpenAITeamPlanTypeExtraKey        = "openai_team_plan_type"
)

// PreserveOpenAITeamCredentialOverrides keeps admin-selected Team routing
// metadata when OAuth refresh responses only describe the user's personal plan.
func PreserveOpenAITeamCredentialOverrides(account *Account, credentials map[string]any) map[string]any {
	if account == nil || credentials == nil || !account.IsOpenAI() || !account.IsOAuth() {
		return credentials
	}

	workspaceID := ""
	planType := ""
	managed := false
	if account.Extra != nil {
		managed, _ = account.Extra[OpenAITeamRotationManagedExtraKey].(bool)
		workspaceID, _ = account.Extra[OpenAITeamWorkspaceIDExtraKey].(string)
		planType, _ = account.Extra[OpenAITeamPlanTypeExtraKey].(string)
	}

	// Backward compatibility for Team accounts imported before explicit markers.
	if !managed && strings.EqualFold(strings.TrimSpace(account.GetCredential("plan_type")), "team") {
		managed = true
		workspaceID = account.GetCredential("chatgpt_account_id")
		planType = "team"
	}
	if !managed {
		return credentials
	}

	workspaceID = strings.TrimSpace(workspaceID)
	if workspaceID == "" {
		workspaceID = strings.TrimSpace(account.GetCredential("chatgpt_account_id"))
	}
	planType = strings.TrimSpace(planType)
	if planType == "" {
		planType = "team"
	}
	if workspaceID != "" {
		credentials["chatgpt_account_id"] = workspaceID
	}
	credentials["plan_type"] = planType
	return credentials
}
