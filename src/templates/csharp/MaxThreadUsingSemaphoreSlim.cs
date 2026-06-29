// Xử lý tối đa n thread tại 1 thời điểm, nếu số thread đã đạt tới mức tối đa
// Sẽ phải đợi có ít nhất 1 thread rảnh rỗi để tiếp tục làm việc

using System.Collections.Concurrent;

namespace TDProject.Core.Business;

/// <summary>
/// Chạy max thread sử dụng SemaphoreSlim
/// </summary>
public class MaxThreadUsingSemaphoreSlim
{
    #region Declare

    /// <summary>
    /// danh sách database id đang chờ xử lý
    /// </summary>
    /// nếu muốn có thể sử dụng kiểu dữ liệu khác thay cho Guid,
    /// ví dụ Guid[] hoặc class cụ thể để chứa data
    private ConcurrentQueue<Guid> _concurrentQueueDBIds = new ConcurrentQueue<Guid>();

    /// <summary>
    /// Semaphore để giới hạn số lượng thread chạy đồng thời
    /// </summary>
    private SemaphoreSlim _semaphore;

    /// <summary>
    /// Số lượng thread tối đa được phép chạy đồng thời
    /// </summary>
    private int _maxThreadCount;

    /// <summary>
    /// Danh sách các task đang chạy để theo dõi
    /// </summary>
    private ConcurrentBag<Task> _runningTasks = new ConcurrentBag<Task>();

    #endregion

    #region Constructor

    /// <summary>
    /// Khởi tạo với số thread tối đa
    /// </summary>
    /// <param name="maxThreadCount">Số lượng thread tối đa (mặc định = 3)</param>
    public MaxThreadUsingSemaphoreSlim(int maxThreadCount = 3)
    {
        _maxThreadCount = maxThreadCount;
        _semaphore = new SemaphoreSlim(maxThreadCount, maxThreadCount);
    }

    #endregion

    #region Methods

    private void DoSlowMethod(Guid dbId)
    {
        Task task = Task.Run(async () =>
        {
            // Đợi để có slot trống (nếu đã đủ max thread)
            await _semaphore.WaitAsync();

            try
            {
                // todo - Thực hiện công việc chậm ở đây, ví dụ gọi API, xử lý dữ liệu, v.v.
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{this.GetType()} {nameof(DoSlowMethod)} - {dbId}: {ex}");
            }
            finally
            {
                // Release semaphore để thread khác có thể chạy
                _semaphore.Release();
            }
        });

        _runningTasks.Add(task);
    }

    /// <summary>
    /// Xử lý tất cả items trong queue
    /// </summary>
    private void ProcessQueue()
    {
        while (_concurrentQueueDBIds.TryDequeue(out Guid currentDB))
        {
            DoSlowMethod(currentDB);
        }
    }

    /// <summary>
    /// Làm việc đa luồng với giới hạn số thread
    /// </summary>
    public void RunTask(int iterations, int dbIdGenerateOneTime)
    {
        // Giả lập trường hợp thêm database vào queue
        // Các thread sẽ được giới hạn bởi semaphore
        for (int currentIteration = 0; currentIteration < iterations; currentIteration++)
        {
            for (int dbIdCount = 0; dbIdCount < dbIdGenerateOneTime; dbIdCount++)
            {
                _concurrentQueueDBIds.Enqueue(Guid.NewGuid());
            }
            // Xử lý queue
            ProcessQueue();
        }

        // Đợi tất cả task hoàn thành
        Task.WaitAll(_runningTasks.ToArray());
    }

    #endregion

    #region Dispose

    /// <summary>
    /// Giải phóng tài nguyên
    /// </summary>
    public void Dispose()
    {
        _semaphore?.Dispose();
    }

    #endregion
}