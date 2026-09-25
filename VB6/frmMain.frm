VERSION 5.00
Object = "{3B7C8863-D78F-101B-B9B5-04021C009402}#1.2#0"; "RICHTX32.OCX"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form frmMain 
   AutoRedraw      =   -1  'True
   BackColor       =   &H00FFFFC0&
   Caption         =   "Buensoft Basta"
   ClientHeight    =   8580
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   11970
   BeginProperty Font 
      Name            =   "MS Sans Serif"
      Size            =   12
      Charset         =   0
      Weight          =   400
      Underline       =   0   'False
      Italic          =   0   'False
      Strikethrough   =   0   'False
   EndProperty
   LinkTopic       =   "Form1"
   Picture         =   "frmMain.frx":0000
   ScaleHeight     =   8580
   ScaleWidth      =   11970
   StartUpPosition =   2  'CenterScreen
   Begin VB.PictureBox picSecondsLeft 
      Appearance      =   0  'Flat
      BackColor       =   &H000000FF&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   375
      Left            =   120
      ScaleHeight     =   375
      ScaleWidth      =   4815
      TabIndex        =   11
      Top             =   2280
      Visible         =   0   'False
      Width           =   4815
      Begin VB.Label lblSecondsLeft 
         Alignment       =   2  'Center
         BackStyle       =   0  'Transparent
         Caption         =   "10 seconds left"
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   14.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FFFFFF&
         Height          =   375
         Left            =   120
         TabIndex        =   12
         Top             =   0
         Width           =   4575
      End
   End
   Begin MSComctlLib.ImageList ImageList1 
      Left            =   5280
      Top             =   3720
      _ExtentX        =   1005
      _ExtentY        =   1005
      BackColor       =   -2147483643
      ImageWidth      =   69
      ImageHeight     =   67
      MaskColor       =   12632256
      _Version        =   393216
      BeginProperty Images {2C247F25-8591-11D1-B16A-00C0F0283628} 
         NumListImages   =   49
         BeginProperty ListImage1 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":0162
            Key             =   "Z"
         EndProperty
         BeginProperty ListImage2 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":3824
            Key             =   "."
         EndProperty
         BeginProperty ListImage3 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":71D6
            Key             =   "holder"
         EndProperty
         BeginProperty ListImage4 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":7F9C
            Key             =   "!"
         EndProperty
         BeginProperty ListImage5 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":B65E
            Key             =   "("
         EndProperty
         BeginProperty ListImage6 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":EFD4
            Key             =   ")"
         EndProperty
         BeginProperty ListImage7 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":1294A
            Key             =   "-"
         EndProperty
         BeginProperty ListImage8 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":1600C
            Key             =   """0"""
            Object.Tag             =   "0"
         EndProperty
         BeginProperty ListImage9 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":195FE
            Key             =   """1"""
            Object.Tag             =   "1"
         EndProperty
         BeginProperty ListImage10 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":1CCC0
            Key             =   """2"""
            Object.Tag             =   "2"
         EndProperty
         BeginProperty ListImage11 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":20382
            Key             =   """3"""
            Object.Tag             =   "3"
         EndProperty
         BeginProperty ListImage12 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":23B14
            Key             =   """4"""
            Object.Tag             =   "4"
         EndProperty
         BeginProperty ListImage13 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":273B6
            Key             =   """5"""
            Object.Tag             =   "5"
         EndProperty
         BeginProperty ListImage14 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":2AB48
            Key             =   """6"""
            Object.Tag             =   "6"
         EndProperty
         BeginProperty ListImage15 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":2E3EA
            Key             =   """7"""
            Object.Tag             =   "7"
         EndProperty
         BeginProperty ListImage16 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":31B7C
            Key             =   """8"""
            Object.Tag             =   "8"
         EndProperty
         BeginProperty ListImage17 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":3530E
            Key             =   """9"""
            Object.Tag             =   "9"
         EndProperty
         BeginProperty ListImage18 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":38AA0
            Key             =   "A"
         EndProperty
         BeginProperty ListImage19 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":3C342
            Key             =   "'"
         EndProperty
         BeginProperty ListImage20 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":3FBE4
            Key             =   "B"
         EndProperty
         BeginProperty ListImage21 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":4355A
            Key             =   "C"
         EndProperty
         BeginProperty ListImage22 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":46DFC
            Key             =   "D"
         EndProperty
         BeginProperty ListImage23 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":4A7AE
            Key             =   "E"
         EndProperty
         BeginProperty ListImage24 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":4E050
            Key             =   "blank2"
         EndProperty
         BeginProperty ListImage25 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":517E2
            Key             =   "¡"
         EndProperty
         BeginProperty ListImage26 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":54EA4
            Key             =   "F"
         EndProperty
         BeginProperty ListImage27 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":58636
            Key             =   "G"
         EndProperty
         BeginProperty ListImage28 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":5BE04
            Key             =   "H"
         EndProperty
         BeginProperty ListImage29 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":5F3F6
            Key             =   "I"
         EndProperty
         BeginProperty ListImage30 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":62C98
            Key             =   "J"
         EndProperty
         BeginProperty ListImage31 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":6653A
            Key             =   "K"
         EndProperty
         BeginProperty ListImage32 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":69BFC
            Key             =   "L"
         EndProperty
         BeginProperty ListImage33 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":6D49E
            Key             =   "M"
         EndProperty
         BeginProperty ListImage34 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":70D40
            Key             =   "N"
         EndProperty
         BeginProperty ListImage35 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":7450E
            Key             =   "Ñ"
         EndProperty
         BeginProperty ListImage36 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":77CDC
            Key             =   "O"
         EndProperty
         BeginProperty ListImage37 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":7B39E
            Key             =   "P"
         EndProperty
         BeginProperty ListImage38 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":7EB6C
            Key             =   "Q"
         EndProperty
         BeginProperty ListImage39 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":8222E
            Key             =   "¿"
         EndProperty
         BeginProperty ListImage40 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":85AD0
            Key             =   "?"
         EndProperty
         BeginProperty ListImage41 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":89372
            Key             =   "R"
         EndProperty
         BeginProperty ListImage42 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":8CA34
            Key             =   "S"
         EndProperty
         BeginProperty ListImage43 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":901C6
            Key             =   "blank"
         EndProperty
         BeginProperty ListImage44 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":93B78
            Key             =   "T"
         EndProperty
         BeginProperty ListImage45 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":9730A
            Key             =   "U"
         EndProperty
         BeginProperty ListImage46 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":9ABAC
            Key             =   "V"
         EndProperty
         BeginProperty ListImage47 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":9E33E
            Key             =   "W"
         EndProperty
         BeginProperty ListImage48 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":A1AD0
            Key             =   "X"
         EndProperty
         BeginProperty ListImage49 {2C247F27-8591-11D1-B16A-00C0F0283628} 
            Picture         =   "frmMain.frx":A5372
            Key             =   "Y"
         EndProperty
      EndProperty
   End
   Begin VB.Timer TimFlashNumber 
      Enabled         =   0   'False
      Interval        =   100
      Left            =   5280
      Top             =   2760
   End
   Begin VB.PictureBox Picture1 
      Appearance      =   0  'Flat
      BackColor       =   &H80000005&
      BorderStyle     =   0  'None
      ForeColor       =   &H80000008&
      Height          =   5410
      Left            =   120
      Picture         =   "frmMain.frx":A8B04
      ScaleHeight     =   5415
      ScaleWidth      =   4815
      TabIndex        =   7
      Top             =   120
      Width           =   4822
      Begin RichTextLib.RichTextBox txtDesc 
         Height          =   4095
         Left            =   450
         TabIndex        =   9
         Top             =   1050
         Width           =   4095
         _ExtentX        =   7223
         _ExtentY        =   7223
         _Version        =   393217
         BackColor       =   0
         BorderStyle     =   0
         Enabled         =   -1  'True
         ScrollBars      =   2
         Appearance      =   0
         TextRTF         =   $"frmMain.frx":FD6E6
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "Comic Sans MS"
            Size            =   12
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
      End
      Begin VB.Label lblWord 
         BackColor       =   &H00000000&
         BackStyle       =   0  'Transparent
         BeginProperty Font 
            Name            =   "Comic Sans MS"
            Size            =   27.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FFFFFF&
         Height          =   615
         Left            =   480
         TabIndex        =   8
         Top             =   360
         Width           =   4095
      End
   End
   Begin VB.Timer timKeyPress 
      Enabled         =   0   'False
      Interval        =   1000
      Left            =   5280
      Top             =   3240
   End
   Begin VB.CommandButton btnKeyPress 
      Caption         =   "Keypress"
      Height          =   495
      Left            =   2520
      TabIndex        =   0
      Top             =   6600
      Width           =   1335
   End
   Begin VB.Timer TimMoveArrow2 
      Enabled         =   0   'False
      Interval        =   2
      Left            =   5280
      Top             =   1800
   End
   Begin VB.Timer TimSecondsLeft 
      Enabled         =   0   'False
      Interval        =   1000
      Left            =   5280
      Top             =   1320
   End
   Begin VB.CommandButton btnHolder 
      DisabledPicture =   "frmMain.frx":FD768
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   24.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   675
      Index           =   0
      Left            =   6060
      Picture         =   "frmMain.frx":FDC6A
      Style           =   1  'Graphical
      TabIndex        =   4
      Top             =   180
      Visible         =   0   'False
      Width           =   660
   End
   Begin VB.Timer timMoveArrow 
      Enabled         =   0   'False
      Interval        =   2
      Left            =   5280
      Top             =   2280
   End
   Begin VB.CommandButton btnStart 
      BackColor       =   &H00FFFFFF&
      Caption         =   "COMENZAR"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   9.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   495
      Left            =   720
      MaskColor       =   &H00FF0000&
      Style           =   1  'Graphical
      TabIndex        =   1
      Top             =   7560
      Visible         =   0   'False
      Width           =   3855
   End
   Begin VB.CommandButton btnSource 
      Caption         =   "A"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   24.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   675
      Index           =   0
      Left            =   -450
      Picture         =   "frmMain.frx":FE227
      Style           =   1  'Graphical
      TabIndex        =   2
      Top             =   2760
      Visible         =   0   'False
      Width           =   660
   End
   Begin VB.TextBox txtPoints 
      Alignment       =   2  'Center
      Appearance      =   0  'Flat
      BackColor       =   &H0000C000&
      BorderStyle     =   0  'None
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   6.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   195
      Index           =   0
      Left            =   11040
      Locked          =   -1  'True
      TabIndex        =   10
      Text            =   "300 Points"
      Top             =   120
      Visible         =   0   'False
      Width           =   855
   End
   Begin VB.TextBox txtPoints2 
      BackColor       =   &H00C00000&
      BorderStyle     =   0  'None
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   200
      Index           =   0
      Left            =   11100
      Locked          =   -1  'True
      TabIndex        =   13
      Top             =   150
      Visible         =   0   'False
      Width           =   830
   End
   Begin VB.Shape shapeDots 
      BorderColor     =   &H000000FF&
      BorderWidth     =   3
      Height          =   850
      Left            =   5950
      Shape           =   4  'Rounded Rectangle
      Top             =   90
      Visible         =   0   'False
      Width           =   5780
   End
   Begin VB.Image imgSource 
      Height          =   735
      Index           =   0
      Left            =   -600
      Stretch         =   -1  'True
      Top             =   5760
      Width           =   735
   End
   Begin VB.Label lblScore 
      BackStyle       =   0  'Transparent
      Caption         =   "00"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   24
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   495
      Left            =   120
      TabIndex        =   6
      Top             =   7920
      Width           =   2775
   End
   Begin VB.Label lblTimeLeft 
      Alignment       =   1  'Right Justify
      BackStyle       =   0  'Transparent
      Caption         =   "30"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   6.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00000000&
      Height          =   255
      Left            =   5280
      TabIndex        =   5
      Top             =   480
      Width           =   255
   End
   Begin VB.Label lblWordNumber 
      Alignment       =   1  'Right Justify
      BackStyle       =   0  'Transparent
      Caption         =   "1"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   15.75
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00400000&
      Height          =   375
      Index           =   0
      Left            =   5505
      TabIndex        =   3
      Top             =   350
      Width           =   420
   End
   Begin VB.Image imgHolder 
      Enabled         =   0   'False
      Height          =   780
      Index           =   0
      Left            =   6000
      Picture         =   "frmMain.frx":FE7E4
      Stretch         =   -1  'True
      Top             =   120
      Visible         =   0   'False
      Width           =   765
   End
   Begin VB.Image imgArrow2 
      Height          =   480
      Left            =   5310
      Picture         =   "frmMain.frx":FF4D7
      Top             =   0
      Width           =   480
   End
   Begin VB.Image imgArrow 
      Height          =   480
      Left            =   5160
      Picture         =   "frmMain.frx":FFDA1
      Top             =   0
      Width           =   480
   End
   Begin VB.Menu mnuGame 
      Caption         =   "&Game"
      Visible         =   0   'False
      Begin VB.Menu mnuNewGame 
         Caption         =   "&New Game"
      End
      Begin VB.Menu mnuExitGame 
         Caption         =   "E&xit Game"
      End
   End
   Begin VB.Menu mnuOptions 
      Caption         =   "&Options"
      Visible         =   0   'False
      Begin VB.Menu mnuLevel 
         Caption         =   "&Level"
         Begin VB.Menu mnuBeginner 
            Caption         =   "&Beginner"
         End
         Begin VB.Menu mnuNovice 
            Caption         =   "&Novice"
         End
         Begin VB.Menu mnuIntermediate 
            Caption         =   "&Intermediate"
         End
         Begin VB.Menu mnuAdvanced 
            Caption         =   "&Advanced"
         End
         Begin VB.Menu mnuExpert 
            Caption         =   "&Expert"
         End
      End
      Begin VB.Menu mnuWordLengh 
         Caption         =   "&Word Lengh"
         Begin VB.Menu mnuWordLen4 
            Caption         =   "&4"
         End
         Begin VB.Menu mnuWordLen5 
            Caption         =   "&5"
         End
         Begin VB.Menu mnuWordLen7 
            Caption         =   "&7"
         End
      End
   End
   Begin VB.Menu mnuLanguage 
      Caption         =   "&Langauge"
      Visible         =   0   'False
      Begin VB.Menu mnuEnglish 
         Caption         =   "&English"
      End
      Begin VB.Menu mnuSpanish 
         Caption         =   "&Spanish"
      End
   End
End
Attribute VB_Name = "frmMain"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit

Dim intLastLetter As Integer
Dim strCurrentWordNumber As Integer
Dim PlayerWordPosition As Integer
Dim intTotalSourceLetters As Integer
Dim ElapsedSeconds As Integer
Dim ComputerWordPosition As Integer
Dim intScore As Integer
Dim intMaxWordLen As Integer
Dim intTotalWords As Integer
Dim bGameinProgress As Boolean
Dim MovingIncrement As Integer
Dim TotalUsedWords As Integer
Dim UsedWord() As String
Dim LetterSet() As String
Dim nLevel As Integer
Dim intBtnDown As Integer
Dim intBtnUp As Integer

Private lngFormWidth As Long
Private lngFormHeight As Long


Private Sub TileBackground()
        Dim pic As Picture
        Dim x%, y%

        Set pic = Me.Picture
        y% = 0
        While y% < Me.Height
                x% = 0
                While x% < Me.Width
                        PaintPicture pic, x%, y%
                        x% = x% + pic.Width \ 2
                Wend
                y% = y% + pic.Height \ 2
        Wend
End Sub

Private Sub btnKeyPress_KeyPress(KeyAscii As Integer)
    Dim sLetter As String
    Dim i%

    If bGameinProgress = False Then Exit Sub 'Game has not started yet
    
    sLetter = UCase(Chr(KeyAscii))
        
    'if Del key then remove one button at a time
    If KeyAscii = 8 Then
        If intLastLetter <= PlayerWordPosition * intMaxWordLen - intMaxWordLen Then Exit Sub
        Call imgHolder_Click(intLastLetter)
        btnKeyPress.SetFocus
    End If
    
    'if ESC key then remove all buttons
    If KeyAscii = 27 Then
        Call imgHolder_Click((PlayerWordPosition * intMaxWordLen - intMaxWordLen + 1))
    End If
    
    'If space bar click on the start button
    If KeyAscii = 32 Then
        'Only if more than 2 letters selected
        If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then
            Call btnStart_Click
        End If
        Exit Sub
    End If
    
    For i% = 1 To intTotalSourceLetters
        If imgSource(i%).Visible = True Then
            If imgSource(i%).Tag = sLetter Then
                Call imgSource_Click(i%)
                btnKeyPress.SetFocus
                Exit Sub
            End If
        End If
    Next i%
    
End Sub



'Remove public procedure?
Public Sub btnStart_Click()

    Select Case btnStart.Caption
        Case "COMENZAR"
            Call Begin_Level
        Case "TERMINAR PALABRA"
            Call CheckWord
        Case Else
        
    End Select

End Sub

Private Sub btnStart_MouseDown(Button As Integer, Shift As Integer, x As Single, y As Single)
    timKeyPress.Enabled = False
End Sub

Private Sub btnStart_MouseUp(Button As Integer, Shift As Integer, x As Single, y As Single)
    timKeyPress.Enabled = True
End Sub

Private Sub btnHolder_MouseDown(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    timKeyPress.Enabled = False
End Sub

Private Sub btnHolder_MouseUp(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    timKeyPress.Enabled = True
End Sub




Private Sub Form_Load()
    Dim i%

    
    dbFile = AppPath & "\Spanish_to_English.mdb"
'    dbFile = AppPath & "\English_to_Spanish.mdb"
 '   dbFile = AppPath & "\Spanish_to_Spanish.mdb"

    frmInstructions.Show
    Me.Visible = False
    Pause (0.5)
        
    'FormEx1.ResizeControls = True

    'Game Settings
    intScore = 0
    'seconds per word

    btnKeyPress.Left = -10000
    
    intBtnDown = 700
    intBtnUp = 735
    MovingIncrement = 10
    intTotalSourceLetters = 12
    intMaxWordLen = 7
    intTotalWords = 10
    nLevel = 1
    
    Load_lblNumbers
    Load_TargetHolders
    Load_TargetLetters
    Load_SourceLetters
    Load_Points_label

    '------------------
    
    imgArrow.Top = -500
    imgArrow2.Top = -500
    lblTimeLeft.Move imgArrow2.Left - 100, imgArrow2.Top + 150
    intLastLetter = 0
    PlayerWordPosition = 0
    bGameinProgress = False
    ComputerWordPosition = 1
    
    
    ReDim UsedWord(0)
    ReDim LetterSet(0)
       
    Get_Random_Word
 
End Sub

Private Sub Form_Paint()
    TileBackground
End Sub

Private Sub Form_Resize()
    TileBackground
End Sub

Private Sub Get_More_Letters()
    Dim i%
        
    For i% = 1 To intTotalSourceLetters
        'btnSource(i%).Tag = ""
        'btnSource(i%).Visible = True
        
        imgSource(i%).Tag = ""
        imgSource(i%).Visible = True
          
    Next i%
    
    Get_Random_Word
    
    
End Sub

Private Sub Form_Unload(Cancel As Integer)
    End
End Sub

Private Sub imgSource_Click(Index As Integer)
'MsgBox imgSource(Index).Tag

    If bGameinProgress = False Then Exit Sub
    
    intLastLetter = intLastLetter + 1
    
    If intLastLetter > PlayerWordPosition * intMaxWordLen Then
        Exit Sub
    End If
    
    'Enable Check Word button if more than 2 letters selected
    If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then btnStart.Visible = True
    '----------------
    
    Reset_if_Previous_Bad_Word

    'btnSource(Index).Visible = False
    imgSource(Index).Visible = False
    
    btnHolder(intLastLetter).Caption = imgSource(Index).Tag
    imgHolder(intLastLetter).Picture = ImageList1.ListImages(imgSource(Index).Tag).Picture
    imgHolder(intLastLetter).Enabled = True
    
    'Save the source index in the target button in case the user removes the letter
    btnHolder(intLastLetter).Tag = Index
    imgHolder(intLastLetter).Tag = Index
    
   ' btnHolder(intLastLetter).Visible = True
    
    'btnHolder(intLastLetter).Visible = True

End Sub

Private Sub imgSource_MouseDown(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    imgSource(Index).Height = intBtnDown
    imgSource(Index).Width = intBtnDown
    timKeyPress.Enabled = False
    
End Sub

Private Sub imgSource_MouseUp(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    imgSource(Index).Height = intBtnUp
    imgSource(Index).Width = intBtnUp
    timKeyPress.Enabled = True
End Sub

Private Sub imgHolder_Click(Index As Integer)
    Dim SourceIndex As Integer
    Dim i%
    Dim LettersRemoved As Integer
    
    Reset_if_Previous_Bad_Word
    
    For i% = Index To intLastLetter
        SourceIndex = Val(btnHolder(i%).Tag)
        'btnSource(SourceIndex).Visible = True
        btnHolder(i%).Tag = ""
        btnHolder(i%).Visible = False
                
        imgSource(SourceIndex).Visible = True
        imgHolder(i%).Tag = ""
        imgHolder(i%).Picture = ImageList1.ListImages("holder").Picture
        imgHolder(i%).Enabled = False
                
        LettersRemoved = LettersRemoved + 1
    Next
    
    
    intLastLetter = intLastLetter - LettersRemoved
            
    'Enable Check Word button if more than 2 letters selected
    If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then
        btnStart.Visible = True
    Else
        btnStart.Visible = False
    End If
    '----------------
End Sub

Private Sub imgHolder_MouseDown(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    imgHolder(Index).Height = intBtnDown + 35
    imgHolder(Index).Width = intBtnDown + 35
 
End Sub

Private Sub imgHolder_MouseUp(Index As Integer, Button As Integer, Shift As Integer, x As Single, y As Single)
    imgHolder(Index).Height = intBtnUp + 45
    imgHolder(Index).Width = intBtnUp + 30

End Sub


Private Sub mnuWordLen4_Click()
    intMaxWordLen = 4
End Sub

Private Sub mnuWordLen5_Click()
    intMaxWordLen = 5

End Sub

Private Sub mnuWordLen7_Click()
        intMaxWordLen = 7
End Sub

Private Sub TimSecondsLeft_Timer()
    Dim SecondsLeft As Integer
    Dim CurrentWord As Integer
    
    SecondsLeft = gSecsXWord - ElapsedSeconds
    CurrentWord = ComputerWordPosition - 1
    
    ElapsedSeconds = ElapsedSeconds + 1
    lblTimeLeft.Caption = SecondsLeft
    If SecondsLeft <= 10 Then
        If ComputerWordPosition = intTotalWords Then
            lblSecondsLeft.Caption = "Faltan " & SecondsLeft & " segundos!"
            picSecondsLeft.Visible = True
        End If
    End If
    
    If lblWordNumber(CurrentWord).ForeColor <> &HC000& Then
        Select Case SecondsLeft
            Case 9
                If gSecsXWord > 10 Then
                    TimFlashNumber.Enabled = True
                End If
                lblWordNumber(CurrentWord).ForeColor = &H80C0FF
            Case 5
                TimFlashNumber.Enabled = True
                lblWordNumber(CurrentWord).ForeColor = &H80FF&             'naranja
            Case 2
                lblWordNumber(CurrentWord).ForeColor = vbRed
            Case 0
                TimFlashNumber.Enabled = False
                lblWordNumber(CurrentWord).Visible = True
        End Select
    End If

    If SecondsLeft = 0 Then
        ComputerWordPosition = ComputerWordPosition + 1
        TimMoveArrow2.Enabled = True
        ElapsedSeconds = 0
    End If

End Sub

Private Sub TimFlashNumber_Timer()
    lblWordNumber(ComputerWordPosition - 1).Visible = Not (lblWordNumber(ComputerWordPosition - 1).Visible)
End Sub

Private Sub timKeyPress_Timer()
    'Remove on Error ?
   On Error Resume Next
    btnKeyPress.SetFocus
End Sub

Private Sub timMoveArrow_Timer()
    

    'move arrow to first word
    If PlayerWordPosition = intTotalWords + 1 Then
        timMoveArrow.Enabled = False
        PlayerWordPosition = 1
    Else 'move to the next word
        imgArrow.Top = imgArrow.Top + MovingIncrement
        
        If imgArrow.Top >= lblWordNumber(PlayerWordPosition - 1).Top - 50 Then
            timMoveArrow.Enabled = False
            shapeDots.Top = imgArrow.Top - 210
            shapeDots.Visible = True
        End If
    End If
    
End Sub

Private Sub Load_TargetLetters()
    Dim Total_Items As Integer
    Dim rowCount As Integer
    Dim nLeft As Integer
    Dim nTop As Integer
    Dim i%

    rowCount = intMaxWordLen
    Total_Items = intMaxWordLen * intTotalWords
    nLeft = 820
    nTop = 840
    
    btnHolder(0).Left = btnHolder(0).Left - nLeft
    
    For i% = 1 To Total_Items
        Load btnHolder(i%)
        'btnHolder(i%).Visible = True
        btnHolder(i%).ZOrder
    Next i%
            
    For i% = 1 To rowCount
        btnHolder(i%).Left = btnHolder(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To Total_Items
        btnHolder(i%).Move btnHolder(i% - rowCount).Left, btnHolder(i% - rowCount).Top + nTop
    Next i%
End Sub



Private Sub Load_lblNumbers()
    Dim i%
    
    'load lbl Numbers
    For i% = 1 To intTotalWords - 1
        Load lblWordNumber(i%)
        lblWordNumber(i%).Top = lblWordNumber(i% - 1).Top + 840
        lblWordNumber(i%).Caption = i% + 1
        lblWordNumber(i%).Visible = True
    Next i%
    
End Sub

Private Sub Load_TargetHolders()
    Dim Total_Items As Integer
    Dim rowCount As Integer
    Dim nLeft As Integer
    Dim nTop As Integer
    Dim i%

    rowCount = intMaxWordLen
    Total_Items = intMaxWordLen * intTotalWords
    nLeft = 820
    nTop = 840
    
    imgHolder(0).Left = imgHolder(0).Left - nLeft

    
    For i% = 1 To Total_Items
        Load imgHolder(i%)
        imgHolder(i%).Visible = True
        imgHolder(i%).ZOrder
    Next i%
            
    For i% = 1 To rowCount
        imgHolder(i%).Left = imgHolder(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To Total_Items
        imgHolder(i%).Move imgHolder(i% - rowCount).Left, imgHolder(i% - rowCount).Top + nTop
    Next i%

End Sub

Private Sub Load_SourceLetters()
    Dim rowCount As Integer
    Dim nLeft As Integer
    Dim nTop As Integer
    Dim i%
    
    rowCount = 6
    nLeft = 800
    nTop = 800

    For i% = 1 To intTotalSourceLetters
        'Load btnSource(i%)
        'btnSource(i%).Caption = ""
        'btnSource(i%).Visible = True
        'btnSource(i%).ZOrder
        
        Load imgSource(i%)
        imgSource(i%).Picture = ImageList1.ListImages("A").Picture
        imgSource(i%).Visible = True
        imgSource(i%).ZOrder
    
    Next i%
                 
    For i% = 1 To rowCount
        'btnSource(i%).Left = btnSource(i% - 1).Left + nLeft
        
        imgSource(i%).Left = imgSource(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To intTotalSourceLetters
        'btnSource(i%).Top = btnSource(i% - rowCount).Top + nTop
        'btnSource(i%).Left = btnSource(i% - rowCount).Left
    
        imgSource(i%).Top = imgSource(i% - rowCount).Top + nTop
        imgSource(i%).Left = imgSource(i% - rowCount).Left
    Next i%
     
End Sub


Private Function Is_a_Vowel(sLetter As String) As Boolean
    
    Select Case sLetter
        Case "A"
            Is_a_Vowel = True
        Case "E"
            Is_a_Vowel = True
        Case "I"
            Is_a_Vowel = True
        Case "O"
            Is_a_Vowel = True
        Case "U"
            Is_a_Vowel = True
        Case Else
            Is_a_Vowel = False
    End Select

End Function


Private Sub CheckWord()
    Dim sWord As String
    Dim Valid_Word As Boolean
    Dim Invalid_Word_Msg As String
    Dim i%
    Dim nWordPoints As Integer
       
    'Disable 2nd Arror temporarly to prevent any the END OF GAME while still checking the word
    TimMoveArrow2.Enabled = False
    
    sWord = ""
    
    'MsgBox PlayerWordPosition * intMaxWordLen - intMaxWordLen + 1 'intLastLetter
    
    For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen + 1 To intLastLetter
        sWord = sWord & btnHolder(i%).Caption
    Next i%
    
    If Was_Word_Used_Before(sWord) = True Then
        Invalid_Word_Msg = "La palabra """ & sWord & """, ya fué utilizada, no se pueden repetir las mismas palabras"
        Valid_Word = False
    Else
        Valid_Word = Word_Exists(sWord)
        If Valid_Word = False Then
            Invalid_Word_Msg = "La palabra """ & sWord & """ no se encuentra en el diccionario"
        End If
    End If
    
    If Valid_Word = True Then
        
        TotalUsedWords = TotalUsedWords + 1
        
        ReDim Preserve UsedWord(TotalUsedWords)
        UsedWord(TotalUsedWords) = sWord
               
        'Make other target buttons visible but with empty caption to complete word
        For i% = intLastLetter + 1 To PlayerWordPosition * intMaxWordLen
            imgHolder(i%).Enabled = False
            imgHolder(i%).Picture = ImageList1.ListImages("blank").Picture
        Next i%
        
        'Make all target buttons blue and disable them
        For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen To PlayerWordPosition * intMaxWordLen
            imgHolder(i%).Enabled = False
        Next i%
        
        'Count the score based on letters used to create the word
        For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen To intLastLetter
            intScore = intScore + 1
        Next i%
                        
        'Stop the flashing and set color to green
        TimFlashNumber.Enabled = False
        lblWordNumber(PlayerWordPosition - 1).ForeColor = &HC000&
        lblWordNumber(PlayerWordPosition - 1).Visible = True
                    
        'Show points earned for current word completation
        
        txtPoints2(PlayerWordPosition - 1).Visible = True
        txtPoints2(PlayerWordPosition - 1).ZOrder
        
        txtPoints(PlayerWordPosition - 1).Visible = True
        txtPoints(PlayerWordPosition - 1).ZOrder
        nWordPoints = gGameLevel * Len(sWord) * 10
        txtPoints(PlayerWordPosition - 1).Text = nWordPoints & " Points"


        intLastLetter = PlayerWordPosition * intMaxWordLen
        PlayerWordPosition = PlayerWordPosition + 1
        timMoveArrow.Enabled = True
        Get_More_Letters
        btnStart.Visible = False
        'ElapsedSeconds = 0
        lblScore.Caption = intScore - 1
        lblWord.Caption = sWord
        lblWord.ForeColor = vbWhite
        txtDesc.SelStart = 0
        txtDesc.SelLength = Len(txtDesc.Text)
        txtDesc.SelColor = vbWhite
        
        Call Show_Meaning(sWord)
        
        If PlayerWordPosition >= intTotalWords + 1 Then
            Done_With_All_Words
        End If
    Else
        For i% = (PlayerWordPosition * intMaxWordLen) - 6 To intLastLetter
            btnHolder(i%).BackColor = vbRed
        Next i%
        lblWord.Caption = sWord
        lblWord.FontStrikethru = True
        lblWord.ForeColor = vbRed
        txtDesc.Text = Invalid_Word_Msg
        txtDesc.SelStart = 0
        txtDesc.SelLength = Len(txtDesc.Text)
        txtDesc.SelColor = vbRed
        
    End If
    
    timMoveArrow.Enabled = True
    TimMoveArrow2.Enabled = True
    
    
End Sub

Private Sub Reset_if_Previous_Bad_Word()
    Dim i%
        
        For i% = (PlayerWordPosition * intMaxWordLen) - (intMaxWordLen - 1) To intLastLetter
            btnHolder(i%).BackColor = &H8000000F
        Next i%
        txtDesc.Text = ""
        lblWord.Caption = ""
        lblWord.FontStrikethru = False

End Sub

Private Function Word_Exists(sWord As String) As Boolean
    Dim oConn As New ADODB.Connection
    Dim oRs As New ADODB.Recordset
    Dim sQuery As String
    
    oConn.Open "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & dbFile & ";Jet OLEDB:Database Password=bsf3572;"
    
    sQuery = "SELECT tWord FROM tblDictionary WHERE tWord = '" & sWord & "'"
    oRs.Open sQuery, oConn, adOpenKeyset, adLockReadOnly
       
    If oRs.BOF <> True And oRs.EOF <> True Then
        Word_Exists = True
    Else
        Word_Exists = False
    End If
    
    oRs.Close
    oConn.Close
    
End Function

Private Sub Show_Meaning(sWord As String)
    Dim oConn As New ADODB.Connection
    Dim oRs As New ADODB.Recordset
    Dim sQuery As String
    
    oConn.Open "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & dbFile & ";Jet OLEDB:Database Password=bsf3572;"
    
    sQuery = "SELECT * FROM tblDictionary WHERE tWord = '" & sWord & "'"
    oRs.Open sQuery, oConn, adOpenKeyset, adLockReadOnly
       
    If oRs.BOF <> True And oRs.EOF <> True Then
        txtDesc.Text = oRs.Fields(1) & ""
        txtDesc.SelStart = 0
        txtDesc.SelLength = Len(txtDesc.Text)
        txtDesc.SelColor = vbWhite
    End If
    
    oRs.Close
    oConn.Close

End Sub

Private Sub TimMoveArrow2_Timer()
    Dim i%
    
    'move arrow to first word
    If ComputerWordPosition = intTotalWords + 1 Then
        'End Game
        If frmShowLevel.Visible <> True Then
            Call End_Game
        End If
    Else 'move to the next word
        imgArrow2.Top = imgArrow2.Top + MovingIncrement
        lblTimeLeft.Top = lblTimeLeft.Top + MovingIncrement
        If imgArrow2.Top >= lblWordNumber(ComputerWordPosition - 1).Top - 50 Then
            TimMoveArrow2.Enabled = False
'            lblTimeLeft.Move imgArrow2.Left - 100, imgArrow2.Top + 150
        End If
        
    End If
    
End Sub

Private Sub Get_Random_Word()
    Dim i%
        
    Dim String_Chars As String
    Dim TotalChars As Integer
    Dim rndLetter As Integer
    Dim rndButton As Integer
    Dim TotalVowels As Integer
    Dim sLetter As String  ' selected letter for source images
    
    Dim oConn As New ADODB.Connection
    Dim oRs As New ADODB.Recordset
    Dim sQuery As String
    Dim RndField As Integer
    Dim sWord As String
    
    Randomize Timer
    
    oConn.Open "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & dbFile & ";Jet OLEDB:Database Password=bsf3572;"
    
    sQuery = "SELECT tWord FROM tblDictionary WHERE Len([tWord]) <= " & Val(intMaxWordLen) & ""
    oRs.Open sQuery, oConn, adOpenKeyset, adLockReadOnly
           
    If oRs.BOF <> True And oRs.EOF <> True Then
        'select a word that has not been used by the user already
        Do
            RndField = Int(Rnd * oRs.RecordCount) + 1
            oRs.Move (RndField)
            sWord = UCase(oRs!tWord) & ""
            If Was_Word_Used_Before(sWord) = False Then Exit Do
        Loop
    End If
    
    oRs.Close
    oConn.Close
        
    Me.Tag = sWord
    
    'Remove this
  '  Me.Caption = sWord
    
    TotalSuggestedWords = TotalSuggestedWords + 1
    ReDim Preserve SuggestedWord(TotalSuggestedWords)
    SuggestedWord(TotalSuggestedWords) = sWord
    
    
    'Put letters from sWord on random source buttons
    String_Chars = sWord
    TotalChars = Len(String_Chars)
    
    For i% = 1 To Len(String_Chars)
        Do
            rndButton = Int(Rnd * intTotalSourceLetters) + 1
            If imgSource(rndButton).Tag = "" Then
                sLetter = Mid(String_Chars, i%, 1)
                'btnSource(rndButton).Caption = sLetter
                'btnSource(rndButton).Tag = sLetter
                imgSource(rndButton).Tag = sLetter
                imgSource(rndButton).Picture = ImageList1.ListImages(sLetter).Picture
                If Is_a_Vowel(sLetter) Then
                    TotalVowels = TotalVowels + 1
                End If
                Exit Do
            End If
        Loop
    Next i%
        
    'Make sure at least 5 buttons have vowels
    If TotalVowels < 5 Then
        String_Chars = "AEIOU"
        TotalChars = Len(String_Chars)
        
        For i% = 0 To (5 - TotalVowels) - 1
            Do
                rndButton = Int(Rnd * intTotalSourceLetters) + 1
                If imgSource(rndButton).Tag = "" Then
                    rndLetter = Int(Rnd * TotalChars) + 1
                    sLetter = Mid(String_Chars, rndLetter, 1)
                    'btnSource(rndButton).Caption = sLetter
                    'btnSource(rndButton).Tag = sLetter
                    imgSource(rndButton).Tag = sLetter
                    imgSource(rndButton).Picture = ImageList1.ListImages(sLetter).Picture
                    Exit Do
                End If
            Loop
        Next i%
    End If
    
    'Add random letters to the rest of the source buttons
    String_Chars = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
    TotalChars = Len(String_Chars)
    For i% = 1 To intTotalSourceLetters
        If imgSource(i%).Tag = "" Then
            rndLetter = Int(Rnd * TotalChars) + 1
            sLetter = Mid(String_Chars, rndLetter, 1)
            'btnSource(i%).Caption = sLetter
            'btnSource(i%).Tag = sLetter
            imgSource(i%).Tag = sLetter
            imgSource(i%).Picture = ImageList1.ListImages(sLetter).Picture
        End If
    Next i%
    
    Dim sRLetters As String
    For i% = 1 To intTotalSourceLetters
        sRLetters = sRLetters & imgSource(i%).Tag
    Next i%
    
   '  MsgBox sRLetters
    
End Sub

Private Sub Done_With_All_Words()
    Dim i%
    Dim Total_Items As Integer
    
    TimSecondsLeft.Enabled = False
    picSecondsLeft.Visible = False
    
    nLevel = nLevel + 1
    Call Show_Level
    
    Total_Items = intMaxWordLen * intTotalWords
    
    shapeDots.Visible = False
    
    'Hide Points labels
    For i% = 0 To intTotalWords - 1
        txtPoints(i%).Visible = False
        txtPoints2(i%).Visible = False
    Next i%
    
    lblWord.Caption = ""
    txtDesc.Text = ""
    
    For i% = 1 To Total_Items
        btnHolder(i%).Caption = ""
        btnHolder(i%).Tag = ""
        btnHolder(i%).Visible = False
        btnHolder(i%).Enabled = True
        imgHolder(i%).Picture = ImageList1.ListImages("holder").Picture
    Next i%
    
    For i% = 0 To intTotalWords - 1
        lblWordNumber(i%).ForeColor = vbBlue
    Next i%
    
    intLastLetter = 0
    ComputerWordPosition = 1
    PlayerWordPosition = 1
    imgArrow.Top = -500
    imgArrow2.Top = -500
    timMoveArrow.Enabled = True
    TimMoveArrow2.Enabled = True
    ElapsedSeconds = 0
    lblTimeLeft.Move imgArrow2.Left - 100, imgArrow2.Top + 150
    TimSecondsLeft.Enabled = True
 
    If gSecsXWord > 5 Then gSecsXWord = gSecsXWord - 1

End Sub

Private Function Was_Word_Used_Before(sWord As String) As Boolean
Dim i%

For i% = 0 To TotalUsedWords
    If UsedWord(i%) = sWord Then Was_Word_Used_Before = True
Next i%

End Function

Private Sub End_Game()
    
    TimSecondsLeft.Enabled = False
    timMoveArrow.Enabled = False
    TimMoveArrow2.Enabled = False
    TimFlashNumber.Enabled = False
    timKeyPress.Enabled = False
    
    MsgBox "End of Game"
    frmPoints.Show 1
    Unload Me

End Sub

Private Sub Begin_Level()
        
    Me.Visible = True
    frmShowLevel.Show 1

    bGameinProgress = True
    PlayerWordPosition = PlayerWordPosition + 1
    btnStart.Caption = "TERMINAR PALABRA"
    btnStart.Visible = False

    TimSecondsLeft.Enabled = True
    timMoveArrow.Enabled = True
    TimMoveArrow2.Enabled = True
    TimFlashNumber.Enabled = True
    timKeyPress.Enabled = True
    
  
End Sub

Private Sub Pause_Game()
    TimSecondsLeft.Enabled = False
    timMoveArrow.Enabled = False
    TimMoveArrow2.Enabled = False
    TimFlashNumber.Enabled = False
    timKeyPress.Enabled = False

End Sub

Private Sub Show_Level()

    frmShowLevel.lblLevel.Caption = "Nivel " & nLevel
    frmShowLevel.Show 1
End Sub

Private Sub Load_Points_label()
    Dim i%
    
    For i% = 1 To intTotalWords - 1
         Load txtPoints(i%)
         txtPoints(i%).Top = txtPoints(i% - 1).Top + 840
    Next i%
    
    For i% = 1 To intTotalWords - 1
         Load txtPoints2(i%)
         txtPoints2(i%).Top = txtPoints2(i% - 1).Top + 840
    Next i%
    
End Sub

