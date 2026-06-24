// Volatile keyword trong C#
// volatile đảm bảo rằng giá trị của field luôn được đọc từ memory chính (không từ CPU cache)
// và việc ghi luôn được ghi ngay vào memory chính (không giữ trong CPU cache)
// Dùng khi nhiều thread cùng truy cập một biến mà không dùng lock

namespace TDProject.Core.Business;

/// <summary>
/// Ví dụ về volatile flag dùng để dừng thread an toàn
/// volatile đảm bảo thread đang chạy thấy được sự thay đổi của _isRunning
/// </summary>
public class VolatileFlagExample
{
    #region Declare

    /// <summary>
    /// volatile flag dùng để dừng thread
    /// volatile: luôn đọc/ghi trực tiếp từ RAM, không dùng CPU cache
    /// </summary>
    private volatile bool _isRunning = true;

    /// <summary>
    /// volatile counter - mỗi lần tăng đều được ghi ngay vào main memory
    /// Dùng volatile thay vì lock trong trường hợp chỉ cần visibility (không cần atomic)
    /// Lưu ý: volatile KHÔNG đảm bảo atomicity (++count vẫn cần Interlocked hoặc lock)
    /// </summary>
    private volatile int _itemsProcessed = 0;

    #endregion

    #region Methods

    /// <summary>
    /// Thread xử lý công việc, chạy cho đến khi _isRunning = false
    /// volatile đảm bảo thread này thấy ngay khi main thread set _isRunning = false
    /// </summary>
    public void WorkerThread()
    {
        Console.WriteLine($"Worker started on thread {Environment.CurrentManagedThreadId}");

        while (_isRunning)
        {
            // đọc _isRunning từ main memory (không cache)
            // nếu không có volatile, thread này có thể cache _isRunning = true vĩnh viễn
            try
            {
                // todo - xử lý công việc
                Interlocked.Increment(ref _itemsProcessed);
                Thread.Sleep(10);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Worker error: {ex.Message}");
            }
        }

        Console.WriteLine($"Worker stopped. Items processed: {_itemsProcessed}");
    }

    /// <summary>
    /// Dừng worker thread an toàn
    /// volatile đảm bảo worker thread thấy được sự thay đổi này ngay lập tức
    /// </summary>
    public void Stop()
    {
        _isRunning = false;
        // volatile: ghi này được flush ngay xuống main memory
        Console.WriteLine("Stop signal sent");
    }

    /// <summary>
    /// Chạy ví dụ
    /// </summary>
    public void Run()
    {
        Task worker = Task.Run(WorkerThread);
        Thread.Sleep(100);
        Stop();
        worker.Wait();
        Console.WriteLine($"Total items processed: {_itemsProcessed}");
    }

    #endregion
}

/// <summary>
/// Ví dụ về volatile với double-checked locking pattern
/// volatile ngăn việc CPU sắp xếp lại lệnh gây lỗi
/// </summary>
public class VolatileDoubleCheckExample
{
    #region Declare

    /// <summary>
    /// volatile: ngăn việc CPU reorder instructions.
    /// Nếu không có volatile, trình biên dịch/CPU có thể gán _instance trước khi constructor chạy xong
    /// </summary>
    private static volatile VolatileDoubleCheckExample _instance;

    private static readonly object _lockObject = new object();

    #endregion

    #region Constructor

    private VolatileDoubleCheckExample()
    {
        // Giả lập khởi tạo tốn thời gian
        Thread.Sleep(100);
        Console.WriteLine($"Instance created on thread {Environment.CurrentManagedThreadId}");
    }

    #endregion

    #region Properties

    /// <summary>
    /// Thread-safe singleton với double-check locking
    /// volatile ngăn CPU reorder: _instance = new VolatileDoubleCheckExample()
    /// có thể bị tách thành (1) cấp phát memory, (2) gán _instance, (3) chạy constructor
    /// volatile đảm bảo thứ tự đúng: (1) cấp phát, (2) chạy constructor, (3) gán _instance
    /// </summary>
    public static VolatileDoubleCheckExample Instance
    {
        get
        {
            if (_instance == null)
            {
                lock (_lockObject)
                {
                    if (_instance == null)
                    {
                        _instance = new VolatileDoubleCheckExample();
                    }
                }
            }
            return _instance;
        }
    }

    #endregion
}

/// <summary>
/// Ví dụ volatile cho hardware register / memory-mapped I/O
/// volatile ngăn compiler optimize bỏ qua các lần đọc liên tiếp
/// </summary>
public static class VolatileHardwareExample
{
    #region Declare

    /// <summary>
    /// Giả lập hardware register (memory-mapped I/O)
    /// volatile: mỗi lần đều phải đọc từ địa chỉ memory thật, không dùng cached value
    /// </summary>
    private static volatile int _hardwareStatusRegister = 0;

    #endregion

    #region Methods

    /// <summary>
    /// Đợi hardware sẵn sàng (polling)
    /// volatile đảm bảo mỗi vòng lặp đều đọc lại giá trị mới từ hardware register
    /// Nếu không có volatile, compiler có thể tối ưu chỉ đọc 1 lần và lặp vô hạn
    /// </summary>
    public static void WaitForHardwareReady()
    {
        Console.WriteLine("Waiting for hardware...");

        // volatile: mỗi lần _hardwareStatusRegister được đọc đều phải đọc từ memory
        while (_hardwareStatusRegister == 0)
        {
            // compiler không thể tối ưu bỏ qua việc đọc _hardwareStatusRegister
            Thread.Sleep(1);
        }

        Console.WriteLine($"Hardware ready! Status: {_hardwareStatusRegister}");
    }

    /// <summary>
    /// Giả lập hardware set status
    /// </summary>
    public static void SetHardwareReady()
    {
        Thread.Sleep(500);
        _hardwareStatusRegister = 1;
        // volatile: ghi này được flush ngay xuống memory
        Console.WriteLine("Hardware status set to ready");
    }

    #endregion
}
