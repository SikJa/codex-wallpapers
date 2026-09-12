using System;
using System.IO;
using System.Diagnostics;
using System.Runtime.InteropServices;
class WallpaperLauncher {
 [DllImport("shell32.dll",CharSet=CharSet.Unicode)] static extern int SetCurrentProcessExplicitAppUserModelID(string id);
 [STAThread] static void Main(){
  var dir=AppDomain.CurrentDomain.BaseDirectory;
  try {
   SetCurrentProcessExplicitAppUserModelID(File.ReadAllText(Path.Combine(dir,"app-id.txt")).Trim());
   var script=Path.Combine(dir,"open.ps1");
   var start=new ProcessStartInfo(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System),"WindowsPowerShell\\v1.0\\powershell.exe"),"-NoProfile -ExecutionPolicy Bypass -File \""+script+"\"");
   start.UseShellExecute=false;start.CreateNoWindow=true;start.WindowStyle=ProcessWindowStyle.Hidden;start.WorkingDirectory=dir;
   using(var p=Process.Start(start)){p.WaitForExit();}
  }catch(Exception e){File.WriteAllText(Path.Combine(dir,"launcher-error.log"),e.Message);}
 }
}
