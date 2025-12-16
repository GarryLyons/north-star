namespace NorthStar.API.Models
{
    public class Stage
    {
        public string Id { get; set; } = string.Empty;
        public string PathwayId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Introduction { get; set; } = string.Empty; // Rich Text HTML
        public string HowYouMightFeelTitle { get; set; } = "How You Might Feel";
        public string HowYouMightFeelDescription { get; set; } = string.Empty; // Rich Text HTML
        public int EstimatedDuration { get; set; }
        public int Order { get; set; }

        // Complex objects stored as JSON in DynamoDB or properties map
        public List<CaregiverTip> CaregiverTips { get; set; } = new List<CaregiverTip>();
        public List<string> ReflectiveQuestions { get; set; } = new List<string>();
        public List<Faq> Faqs { get; set; } = new List<Faq>();
        public List<OnlineResource> OnlineResources { get; set; } = new List<OnlineResource>();
    }

    public class CaregiverTip
    {
        public string Summary { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty; // Rich Text
    }

    public class Faq
    {
        public string Question { get; set; } = string.Empty;
        public string Answer { get; set; } = string.Empty; // Rich Text
    }

    public class OnlineResource
    {
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
