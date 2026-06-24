// Design Pattern: Adapter
// Chuyển đổi interface của một class thành interface khác mà client mong đợi,
// giúp các class không tương thích có thể làm việc cùng nhau

namespace TDProject.Core.Business;

#region Target Interface

/// <summary>
/// Interface mà client đang sử dụng
/// </summary>
public interface IApiService
{
    /// <summary>
    /// Gửi request GET
    /// </summary>
    Task<string> GetAsync(string endpoint);

    /// <summary>
    /// Gửi request POST
    /// </summary>
    Task<string> PostAsync(string endpoint, string body);
}

#endregion

#region Adaptee (Class có sẵn cần tích hợp)

/// <summary>
/// Thư viện HTTP cũ không tương thích với interface IApiService
/// Class này không thể thay đổi được (third-party, legacy)
/// </summary>
public class LegacyHttpClient
{
    private readonly string _baseUrl;

    public LegacyHttpClient(string baseUrl)
    {
        _baseUrl = baseUrl;
    }

    /// <summary>
    /// Method cũ với tên và tham số khác
    /// </summary>
    public string MakeHttpRequest(string method, string url, string payload = null)
    {
        // todo - thực hiện HTTP request
        Console.WriteLine($"LegacyHttpClient: {method} {_baseUrl}{url}");
        if (!string.IsNullOrEmpty(payload))
            Console.WriteLine($"Payload: {payload}");

        return $"{{\"status\":\"ok from legacy\"}}";
    }
}

#endregion

#region Adapter

/// <summary>
/// Adapter chuyển đổi LegacyHttpClient sang IApiService
/// Client không cần biết gì về LegacyHttpClient
/// </summary>
public class LegacyHttpAdapter : IApiService
{
    private readonly LegacyHttpClient _legacyClient;

    public LegacyHttpAdapter(string baseUrl)
    {
        _legacyClient = new LegacyHttpClient(baseUrl);
    }

    /// <summary>
    /// Chuyển đổi GetAsync -> MakeHttpRequest với method GET
    /// </summary>
    public Task<string> GetAsync(string endpoint)
    {
        string result = _legacyClient.MakeHttpRequest("GET", endpoint);
        return Task.FromResult(result);
    }

    /// <summary>
    /// Chuyển đổi PostAsync -> MakeHttpRequest với method POST
    /// </summary>
    public Task<string> PostAsync(string endpoint, string body)
    {
        string result = _legacyClient.MakeHttpRequest("POST", endpoint, body);
        return Task.FromResult(result);
    }
}

#endregion

#region Another Adaptee

/// <summary>
/// Một class cũ khác cần tích hợp - XML-based service
/// </summary>
public class XmlWeatherService
{
    /// <summary>
    /// Service cũ trả về XML thay vì JSON
    /// </summary>
    public string GetWeatherXml(string city)
    {
        // todo - gọi service thực tế
        return $"<weather><city>{city}</city><temp>25</temp></weather>";
    }
}

/// <summary>
/// Interface mới cho weather service
/// </summary>
public interface IWeatherService
{
    /// <summary>
    /// Lấy thông tin thời tiết trả về dạng JSON
    /// </summary>
    Task<string> GetWeatherJsonAsync(string city);
}

/// <summary>
/// Adapter chuyển XML service sang JSON interface
/// </summary>
public class WeatherServiceAdapter : IWeatherService
{
    private readonly XmlWeatherService _xmlService;

    public WeatherServiceAdapter(XmlWeatherService xmlService)
    {
        _xmlService = xmlService;
    }

    public Task<string> GetWeatherJsonAsync(string city)
    {
        string xml = _xmlService.GetWeatherXml(city);
        // todo - parse XML và chuyển thành JSON
        string json = $"{{\"city\":\"{city}\",\"temp\":25}}";
        Console.WriteLine($"Converted XML to JSON: {json}");
        return Task.FromResult(json);
    }
}

#endregion

/// <summary>
/// Ví dụ sử dụng Adapter Pattern
/// </summary>
public class AdapterExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - adapter làm cầu nối giữa interface cũ và mới
    /// </summary>
    public async Task Run()
    {
        // Client chỉ biết interface IApiService
        // LegacyHttpClient hoàn toàn ẩn sau adapter
        IApiService api = new LegacyHttpAdapter("https://api.example.com");
        string response = await api.GetAsync("/users");
        Console.WriteLine($"Response: {response}");

        // Adapter cho weather service
        IWeatherService weather = new WeatherServiceAdapter(new XmlWeatherService());
        string weatherJson = await weather.GetWeatherJsonAsync("Hanoi");
        Console.WriteLine($"Weather: {weatherJson}");
    }

    #endregion
}
