Attribute VB_Name = "Module1"
'Transparent form
Public Const GWL_EXSTYLE = (-20)
Public Const WS_EX_TRANSPARENT = &H20&
Public Const SWP_FRAMECHANGED = &H20
Public Const SWP_NOMOVE = &H2
Public Const SWP_NOSIZE = &H1
Public Const SWP_SHOWME = SWP_FRAMECHANGED Or _
SWP_NOMOVE Or SWP_NOSIZE
Public Const HWND_NOTOPMOST = -2
Declare Function SetWindowLong Lib "user32" _
Alias "SetWindowLongA" _
(ByVal hwnd As Long, ByVal nIndex As Long, _
ByVal dwNewLong As Long) As Long
Declare Function SetWindowPos Lib "user32" _
(ByVal hwnd As Long, ByVal hWndInsertAfter _
As Long, ByVal x As Long, ByVal y As Long, _
ByVal cx As Long, ByVal cy As Long, _
ByVal wFlags As Long) As Long
'-------------------


Global TotalSuggestedWords As Integer
Global SuggestedWord() As String
Global dbFile As String

Public Function AppPath() As String
    Dim strPath As String
    strPath = App.Path
    If Right$(strPath, 1) <> "\" Then
       strPath = strPath & "\"
    End If
    AppPath = strPath
End Function

Public Sub Pause(interval As Integer)
          'pause/waits for "interval" seconds
          Current = Timer
          Do While Timer - Current < Val(interval)
          DoEvents
          Loop
End Sub

