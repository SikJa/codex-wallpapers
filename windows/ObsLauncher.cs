using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Security.Cryptography;
using System.Text;

// Compiled locally as WinExe: no console is allocated, including with Windows
// Terminal configured as the default host. Only the OBS server is launched.
class ObsLauncher {
 static string Quote(string value) { return "\"" + value + "\""; }
 [STAThread] static void Main(string[] args) {
  if(args.Length != 4) return;
  string node=args[0], entry=args[1], storage=args[2], port=args[3];
  string key;
  using(var hash=SHA256.Create()) key=BitConverter.ToString(hash.ComputeHash(Encoding.UTF8.GetBytes(storage.ToLowerInvariant()+port))).Replace("-", "");
  using(var mutex=new Mutex(false,"Local.CodexWallpapers.OBS."+key)) {
   bool acquired=false;
   try {
    try { acquired=mutex.WaitOne(0); } catch(AbandonedMutexException) { acquired=true; }
    if(!acquired) return;
    Directory.CreateDirectory(storage);
    var start=new ProcessStartInfo(node,Quote(entry));
    start.UseShellExecute=false; start.CreateNoWindow=true;
    start.WindowStyle=ProcessWindowStyle.Hidden;
    start.WorkingDirectory=Path.GetDirectoryName(entry);
    start.EnvironmentVariables["CODEX_WALLPAPERS_DATA"]=storage;
    start.EnvironmentVariables["CW_OBS_PORT"]=port;
    start.RedirectStandardOutput=true; start.RedirectStandardError=true;
    using(var child=new Process()) {
     child.StartInfo=start;
     child.OutputDataReceived+=(s,e)=>{if(e.Data!=null)File.AppendAllText(Path.Combine(storage,"obs-overlay.log"),e.Data+Environment.NewLine);};
     child.ErrorDataReceived+=(s,e)=>{if(e.Data!=null)File.AppendAllText(Path.Combine(storage,"obs-overlay-error.log"),e.Data+Environment.NewLine);};
     child.Start(); child.BeginOutputReadLine(); child.BeginErrorReadLine(); child.WaitForExit();
    }
   } catch(Exception e) { try{File.AppendAllText(Path.Combine(storage,"obs-overlay-error.log"),e.Message+Environment.NewLine);}catch{} }
   finally { if(acquired)mutex.ReleaseMutex(); }
  }
 }
}
