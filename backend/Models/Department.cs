namespace NorthStar.API.Models
{
    public class Department
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string InstitutionId { get; set; } = string.Empty;
        // Optional: Description, HeadOfDept, etc.
    }
}
