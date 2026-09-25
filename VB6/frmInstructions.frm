VERSION 5.00
Begin VB.Form frmInstructions 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Buensoft Zap 2004"
   ClientHeight    =   5415
   ClientLeft      =   45
   ClientTop       =   435
   ClientWidth     =   9885
   DrawMode        =   1  'Blackness
   BeginProperty Font 
      Name            =   "MS Sans Serif"
      Size            =   13.5
      Charset         =   0
      Weight          =   400
      Underline       =   0   'False
      Italic          =   0   'False
      Strikethrough   =   0   'False
   EndProperty
   ForeColor       =   &H00000000&
   Icon            =   "frmInstructions.frx":0000
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   ScaleHeight     =   5415
   ScaleWidth      =   9885
   StartUpPosition =   2  'CenterScreen
   Begin VB.CommandButton btnPlay 
      Caption         =   "PLAY NOW"
      Default         =   -1  'True
      Height          =   735
      Left            =   6120
      TabIndex        =   5
      Top             =   3960
      Width           =   2175
   End
   Begin VB.Frame Frame1 
      Caption         =   "Game Skill"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000000&
      Height          =   1815
      Left            =   6720
      TabIndex        =   1
      Top             =   240
      Width           =   2655
      Begin VB.OptionButton OptLevel 
         Caption         =   "Expert"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   255
         Index           =   2
         Left            =   240
         TabIndex        =   4
         Top             =   1320
         Width           =   2295
      End
      Begin VB.OptionButton OptLevel 
         Caption         =   "Intermediate"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         Height          =   255
         Index           =   1
         Left            =   240
         TabIndex        =   3
         Top             =   840
         Value           =   -1  'True
         Width           =   2295
      End
      Begin VB.OptionButton OptLevel 
         Caption         =   "Beginner"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00000000&
         Height          =   255
         Index           =   0
         Left            =   240
         TabIndex        =   2
         Top             =   360
         Width           =   2295
      End
   End
   Begin VB.Label lblInstructions 
      BackColor       =   &H00FFFFFF&
      BackStyle       =   0  'Transparent
      Caption         =   "The point of this game is to create as many Spanish words as you can remember. You'll have only 10 seconds for each word."
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000000&
      Height          =   1935
      Left            =   5040
      TabIndex        =   0
      Top             =   2760
      Width           =   4215
   End
   Begin VB.Label Label1 
      Appearance      =   0  'Flat
      BackColor       =   &H0000FFFF&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "  How to Play"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   13.5
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H80000008&
      Height          =   2655
      Left            =   4800
      TabIndex        =   6
      Top             =   2280
      Width           =   4575
   End
   Begin VB.Label Label2 
      Appearance      =   0  'Flat
      BackColor       =   &H00404040&
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H80000008&
      Height          =   2655
      Left            =   5040
      TabIndex        =   7
      Top             =   2400
      Width           =   4455
   End
   Begin VB.Image Image1 
      Height          =   4545
      Left            =   360
      Picture         =   "frmInstructions.frx":08CA
      Top             =   360
      Width           =   6045
   End
End
Attribute VB_Name = "frmInstructions"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub btnPlay_Click()
    
    Me.Visible = False
    
    gSecsXWord = 40 - (gGameLevel * 10)
   Call frmMain.btnStart_Click
    
    Unload Me


End Sub

Private Sub Form_Load()
    gGameLevel = 2
End Sub

Private Sub OptLevel_Click(Index As Integer)
    Dim i%
    
    For i% = 0 To 2
        OptLevel(i%).Font.Bold = False
    Next i%
    
    OptLevel(Index).Font.Bold = True
         
    
    Select Case Index
        Case 0
            gGameLevel = 1
        Case 1
            gGameLevel = 2
        Case 2
            gGameLevel = 3
    End Select
    
End Sub
