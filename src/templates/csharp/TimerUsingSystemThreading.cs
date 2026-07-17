using System;
using System.Timers;

class Program
{
    static int _counter = 0;

    static void Main()
    {
        System.Timers.Timer? timer = null;
        try
        {
            timer = new System.Timers.Timer(1000);
            timer.Elapsed += TimerElapsed;
            timer.AutoReset = true;
            timer.Start();

            Console.WriteLine("Timer started. Press 'q' to stop...");
            while (Console.ReadKey(true).KeyChar != 'q') { }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        finally
        {
            if (timer != null)
            {
                timer.Stop();
                timer.Dispose();
                Console.WriteLine("Timer stopped and disposed.");
            }
        }
    }

    static void TimerElapsed(object? sender, ElapsedEventArgs e)
    {
        try
        {
            _counter++;
            Console.WriteLine($"[{e.SignalTime:HH:mm:ss}] Tick #{_counter}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Elapsed: {ex.Message}");
        }
    }
}
