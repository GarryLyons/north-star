namespace NorthStar.API.Models
{
    public class InviteUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        // "DisplayName" requested in prompt, mapping from First/Last if needed, or adding explicitly. 
        // Prompt says "email, displayName". I'll keep First/Last but add DisplayName property or derived.
        // Actually prompt explicit requested "email, displayName". 
        // I will add DisplayName to DTO. 
        public string DisplayName { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty; // super-admin / institution-user / department-user / pathway-user
        public string Scope { get; set; } = string.Empty; // e.g. "institutionId" OR "departmentId" OR "pathwayIds"

        public List<string> Permissions { get; set; } = new List<string>();
    }

    public class User
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Scope { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new List<string>();
        public string Status { get; set; } = string.Empty; // Confirmed, Unconfirmed
    }

    public static class UserRoles
    {
        public const string SuperAdmin = "super-admin";
        public const string InstitutionUser = "institution-user";
        public const string DepartmentUser = "department-user";
        public const string PathwayUser = "pathway-user";
    }

    public static class UserPermissions
    {
        public const string CreateUser = "CREATE_USER";
        public const string CreateDepartment = "CREATE_DEPARTMENT";
        public const string CreatePathway = "CREATE_PATHWAY";
        public const string ManagePermissions = "MANAGE_PERMISSIONS";
        public const string View = "VIEW";
        public const string EditPathway = "EDIT_PATHWAY";
    }
    public class CreateInstitutionUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string InstitutionId { get; set; } = string.Empty; // Required

        // Toggles
        public bool CanCreateUser { get; set; }
        public bool CanCreateDepartment { get; set; }
        public bool CanCreatePathway { get; set; }
        public bool CanManagePermissions { get; set; }
    }

    public class CreateDepartmentUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DepartmentId { get; set; } = string.Empty; // Required

        // Toggles
        public bool CanCreatePathway { get; set; } // department only
        public bool CanCreateUser { get; set; } // department scoped users only
    }

    public class CreatePathwayUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;

        public List<string> PathwayIds { get; set; } = new List<string>(); // 1..N Required
    }
}
