// Design Pattern: Singleton
// Đảm bảo một class chỉ có duy nhất một instance và cung cấp global access point
// Pattern này phù hợp khi cần quản lý tài nguyên dùng chung (configuration, logger, cache)

namespace TDProject.Core.Business;

/// <summary>
/// Singleton pattern - Thread-safe với Double-check locking
/// </summary>
public class Singleton
{
    #region Declare

    /// <summary>
    /// Instance duy nhất của class, volatile để đảm bảo tính nhất quán giữa các thread
    /// </summary>
    private static volatile Singleton _instance;

    /// <summary>
    /// Object dùng để lock khi khởi tạo instance
    /// </summary>
    private static readonly object _lockObject = new object();

    /// <summary>
    /// Counter để kiểm tra chỉ có 1 instance được tạo
    /// </summary>
    private static int _instanceCount = 0;

    #endregion

    #region Constructor

    /// <summary>
    /// Constructor private để ngăn việc tạo instance từ bên ngoài
    /// </summary>
    private Singleton()
    {
        int currentCount = Interlocked.Increment(ref _instanceCount);
        Console.WriteLine($"Singleton instance created. Total instances: {currentCount}");
    }

    #endregion

    #region Properties

    /// <summary>
    /// Global access point để lấy instance duy nhất
    /// Sử dụng double-check locking để tối ưu performance
    /// </summary>
    public static Singleton Instance
    {
        get
        {
            // Kiểm tra nhanh không cần lock (performance optimization)
            if (_instance == null)
            {
                lock (_lockObject)
                {
                    // Kiểm tra lại sau khi lock (double-check)
                    if (_instance == null)
                    {
                        _instance = new Singleton();
                    }
                }
            }
            return _instance;
        }
    }

    #endregion

    #region Methods

    /// <summary>
    /// Ví dụ method nghiệp vụ
    /// </summary>
    public void DoWork()
    {
        Console.WriteLine($"{nameof(Singleton)} is working...");
    }

    #endregion
}
