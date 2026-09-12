using System;
using System.Runtime.InteropServices;
public static class WallpaperShortcut {
 [StructLayout(LayoutKind.Sequential)] struct Key {public Guid fmtid;public uint pid;}
 [StructLayout(LayoutKind.Explicit,Size=24)] struct Value {[FieldOffset(0)]public ushort type;[FieldOffset(8)]public IntPtr text;}
 [ComImport,Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)] interface Store {
  uint GetCount();void GetAt(uint i,out Key k);void GetValue(ref Key k,out Value v);void SetValue(ref Key k,ref Value v);void Commit();
 }
 [DllImport("shell32.dll",CharSet=CharSet.Unicode,PreserveSig=false)] static extern void SHGetPropertyStoreFromParsingName(string path,IntPtr context,uint flags,ref Guid iid,[MarshalAs(UnmanagedType.Interface)]out Store store);
 public static void Set(string path,string id){var iid=typeof(Store).GUID;Store store;SHGetPropertyStoreFromParsingName(path,IntPtr.Zero,2,ref iid,out store);
  var key=new Key{fmtid=new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3"),pid=5};var value=new Value{type=31,text=Marshal.StringToCoTaskMemUni(id)};
  try{store.SetValue(ref key,ref value);store.Commit();}finally{Marshal.FreeCoTaskMem(value.text);Marshal.ReleaseComObject(store);}
 }
}
