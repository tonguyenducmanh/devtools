// Test việc chạy 2 thread song song
// 1 thread luôn làm việc thêm dữ liệu vào biến lưu trữ global
// 1 thread luôn làm việc đọc dữ liệu ra và handle nghiệp vụ

using System.Collections.Concurrent;

namespace TDProject.Core.Business;

/// <summary>
/// Test chạy song song 2 luồng bằng kiểu dữ liệu concurrentqueue
/// </summary>
public class TwoThreadUsingConcurrentQueue
{
    #region Declare

    /// <summary>
    /// danh cách database id đang chờ xử lý
    /// </summary>
    private ConcurrentQueue<Guid> _concurrentQueueDBIds = new ConcurrentQueue<Guid>();

    /// <summary>
    /// cờ quạt nhận biết có đang chạy lệnh ở thread xử lý nghiệp vụ không
    /// </summary>
    private bool _isRunningBussinessThread = false;

    #endregion

    #region Methods

    private void DoSlowMethod()
    {
        // nếu đã có task run rồi thì cứ chạy tiếp vòng while trong task đó
        if (_isRunningBussinessThread)
        {
            return;
        }


        _isRunningBussinessThread = true;

        // chưa có thì run task mới
        Task.Run(() =>
        {
            try
            {
                while (_concurrentQueueDBIds.Count > 0)
                {
                    Guid currentDB;
                    _concurrentQueueDBIds.TryDequeue(out currentDB);
                    // luôn phải có try catch khi làm việc đa luồng
                    try
                    {
                        // todo something slow here
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"{this.GetType()} {nameof(DoSlowMethod)}" + ex);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{this.GetType()} {nameof(DoSlowMethod)}" + ex);
            }
            finally
            {
                _isRunningBussinessThread = false;
            }
        });
    }

    /// <summary>
    /// làm việc đa luồng
    /// </summary>
    public void RunTask(int iterations, int dbIdGenerateOneTime)
    {
        // giả lập trường hợp thêm 1 database nào list
        // sau đó 1 thread khác đọc list database và in ra màn hình
        for (int currentIteration = 0; currentIteration < iterations; currentIteration++)
        {
            for (int dbIdCount = 0; dbIdCount < dbIdGenerateOneTime; dbIdCount++)
            {
                _concurrentQueueDBIds.Enqueue(Guid.NewGuid());
            }
            DoSlowMethod();
        }

        while (_concurrentQueueDBIds.Count > 0)
        {
            // nếu còn đang xử lý thì chưa dừng thread chính để trace log
            TDSlowMethod.CPUBurnByTime(TimeSpan.FromSeconds(2));
        }
    }

    #endregion
}