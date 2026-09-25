VERSION 5.00
Begin VB.Form frmShowLevel 
   BackColor       =   &H00FFFFFF&
   BorderStyle     =   1  'Fixed Single
   ClientHeight    =   2895
   ClientLeft      =   15
   ClientTop       =   15
   ClientWidth     =   7215
   ClipControls    =   0   'False
   ControlBox      =   0   'False
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   2895
   ScaleWidth      =   7215
   StartUpPosition =   1  'CenterOwner
   Begin VB.Timer Timer1 
      Interval        =   2000
      Left            =   0
      Top             =   1920
   End
   Begin VB.Label lblMode 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "Modo Experto"
      BeginProperty Font 
         Name            =   "Arial Black"
         Size            =   27.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000000&
      Height          =   1020
      Left            =   120
      TabIndex        =   1
      Top             =   120
      Width           =   7005
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
      ForeColor       =   &H000000FF&
      Height          =   1920
      Left            =   840
      TabIndex        =   0
      Top             =   600
      Width           =   5565
   End
End
Attribute VB_Name = "frmShowLevel"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False




Private Sub Form_Load()
    Dim sMode As String
    
    Select Case gGameLevel
        Case 1
            sMode = "MODO PRINCIPIANTE"
        Case 2
            sMode = "MODO INTERMEDIO"
        Case 3
            sMode = "MODO AVANZADO"
    End Select
    
    lblMode.Caption = sMode
End Sub

Private Sub Timer1_Timer()

    frmMain.shapeDots.Visible = True
    Unload Me

End Sub
