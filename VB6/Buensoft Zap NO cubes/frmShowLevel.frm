VERSION 5.00
Begin VB.Form frmShowLevel 
   BackColor       =   &H0000FFFF&
   BorderStyle     =   0  'None
   Caption         =   "frmShowLevelNumber"
   ClientHeight    =   1980
   ClientLeft      =   0
   ClientTop       =   0
   ClientWidth     =   7215
   ClipControls    =   0   'False
   ControlBox      =   0   'False
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   1980
   ScaleWidth      =   7215
   ShowInTaskbar   =   0   'False
   StartUpPosition =   1  'CenterOwner
   Begin VB.Timer Timer1 
      Interval        =   1000
      Left            =   240
      Top             =   240
   End
   Begin VB.Label lblLevel 
      Alignment       =   2  'Center
      AutoSize        =   -1  'True
      BackStyle       =   0  'Transparent
      Caption         =   "Nivel 1"
      BeginProperty Font 
         Name            =   "Arial Black"
         Size            =   72
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00C00000&
      Height          =   2040
      Left            =   720
      TabIndex        =   0
      Top             =   -120
      Width           =   5565
   End
End
Attribute VB_Name = "frmShowLevel"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False




Private Sub Timer1_Timer()
  Static nSeconds As Integer
  
  nSeconds = nSeconds + 1
  
  If nSeconds >= 3 Then
    Timer1.Enabled = False
    Unload Me
  End If
  
End Sub
