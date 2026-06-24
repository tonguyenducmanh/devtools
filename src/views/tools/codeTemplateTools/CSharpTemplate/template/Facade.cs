// Design Pattern: Facade
// Cung cấp một interface đơn giản cho một hệ thống phức tạp
// Pattern này giúp giảm sự phụ thuộc và dễ sử dụng hơn cho client

namespace TDProject.Core.Business;

#region Complex Subsystems

/// <summary>
/// Subsystem: quản lý kết nối database
/// </summary>
public class DatabaseManager
{
    public void Connect(string connectionString)
    {
        // todo - kết nối database thực tế
        Console.WriteLine($"DatabaseManager: Connected to {connectionString}");
    }

    public void Disconnect()
    {
        Console.WriteLine("DatabaseManager: Disconnected");
    }

    public bool IsConnected
    {
        get
        {
            // todo - kiểm tra kết nối thực tế
            return true;
        }
    }
}

/// <summary>
/// Subsystem: quản lý cache
/// </summary>
public class CacheManager
{
    private readonly Dictionary<string, object> _cache = new Dictionary<string, object>();

    public void Set(string key, object value)
    {
        lock (_cache)
        {
            _cache[key] = value;
        }
        Console.WriteLine($"CacheManager: Cached {key}");
    }

    public T Get<T>(string key)
    {
        lock (_cache)
        {
            if (_cache.TryGetValue(key, out object value))
                return (T)value;
            return default;
        }
    }

    public void Clear()
    {
        lock (_cache)
        {
            _cache.Clear();
        }
        Console.WriteLine("CacheManager: Cache cleared");
    }
}

/// <summary>
/// Subsystem: quản lý logging
/// </summary>
public class LogManager
{
    public void LogInfo(string message)
    {
        Console.WriteLine($"[INFO] {DateTime.Now:HH:mm:ss} - {message}");
    }

    public void LogError(string message, Exception ex = null)
    {
        Console.WriteLine($"[ERROR] {DateTime.Now:HH:mm:ss} - {message}");
        if (ex != null)
            Console.WriteLine($"[ERROR] Exception: {ex.Message}");
    }

    public void LogWarning(string message)
    {
        Console.WriteLine($"[WARN] {DateTime.Now:HH:mm:ss} - {message}");
    }
}

#endregion

#region Facade

/// <summary>
/// Facade cung cấp interface đơn giản cho toàn bộ hệ thống phức tạp
/// Client chỉ cần gọi các method trên Facade, không cần biết chi tiết bên trong
/// </summary>
public class DataProcessingFacade
{
    #region Declare

    private readonly DatabaseManager _database;
    private readonly CacheManager _cache;
    private readonly LogManager _logger;

    #endregion

    #region Constructor

    public DataProcessingFacade()
    {
        _database = new DatabaseManager();
        _cache = new CacheManager();
        _logger = new LogManager();
    }

    #endregion

    #region Methods

    /// <summary>
    /// Khởi tạo toàn bộ hệ thống
    /// </summary>
    public void Initialize(string connectionString)
    {
        _logger.LogInfo("Initializing system...");
        _database.Connect(connectionString);
        _cache.Clear();
        _logger.LogInfo("System initialized successfully");
    }

    /// <summary>
    /// Xử lý dữ liệu - bao gồm kiểm tra cache, query database, lưu kết quả
    /// </summary>
    public async Task<T> ProcessData<T>(string queryKey, Func<Task<T>> dataFetcher)
    {
        _logger.LogInfo($"Processing data for key: {queryKey}");

        // Kiểm tra cache trước
        T cachedData = _cache.Get<T>(queryKey);
        if (cachedData != null)
        {
            _logger.LogInfo($"Returning cached data for {queryKey}");
            return cachedData;
        }

        // Nếu không có cache thì fetch từ database
        _logger.LogInfo($"Cache miss for {queryKey}, fetching from database");
        try
        {
            if (!_database.IsConnected)
            {
                throw new InvalidOperationException("Database is not connected");
            }

            T result = await dataFetcher();
            _cache.Set(queryKey, result);
            _logger.LogInfo($"Data processed and cached for {queryKey}");
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Failed to process data for {queryKey}", ex);
            throw;
        }
    }

    /// <summary>
    /// Giải phóng tài nguyên
    /// </summary>
    public void Shutdown()
    {
        _logger.LogInfo("Shutting down system...");
        _cache.Clear();
        _database.Disconnect();
        _logger.LogInfo("System shut down successfully");
    }

    #endregion
}

#endregion

/// <summary>
/// Ví dụ sử dụng Facade Pattern
/// </summary>
public class FacadeExample
{
    #region Methods

    /// <summary>
    /// Chạy ví dụ - client chỉ gọi facade, không gọi trực tiếp subsystems
    /// </summary>
    public async Task Run()
    {
        DataProcessingFacade facade = new DataProcessingFacade();
        facade.Initialize("Server=localhost;Database=Test;");

        // Client không cần biết sự tồn tại của DatabaseManager, CacheManager, LogManager
        string result = await facade.ProcessData("user_123", async () =>
        {
            // todo - query database thực tế
            await Task.Delay(100);
            return "User data from database";
        });

        Console.WriteLine($"Result: {result}");
        facade.Shutdown();
    }

    #endregion
}
