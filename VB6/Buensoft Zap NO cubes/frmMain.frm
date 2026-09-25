VERSION 5.00
Object = "{3B7C8863-D78F-101B-B9B5-04021C009402}#1.2#0"; "richtx32.ocx"
Begin VB.Form frmMain 
   AutoRedraw      =   -1  'True
   BackColor       =   &H8000000D&
   Caption         =   "Buensoft Zap"
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
   Begin VB.Timer TimFlashNumber 
      Enabled         =   0   'False
      Interval        =   100
      Left            =   4800
      Top             =   5880
   End
   Begin VB.PictureBox Picture1 
      BackColor       =   &H00000000&
      Height          =   5120
      Left            =   240
      ScaleHeight     =   5055
      ScaleWidth      =   4830
      TabIndex        =   7
      Top             =   240
      Width           =   4885
      Begin RichTextLib.RichTextBox txtDesc 
         Height          =   4215
         Left            =   240
         TabIndex        =   9
         Top             =   840
         Width           =   4575
         _ExtentX        =   8070
         _ExtentY        =   7435
         _Version        =   393217
         BackColor       =   0
         BorderStyle     =   0
         ScrollBars      =   2
         Appearance      =   0
         TextRTF         =   $"frmMain.frx":09BF
      End
      Begin VB.Label lblWord 
         BackColor       =   &H00000000&
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   27.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00000000&
         Height          =   615
         Left            =   240
         TabIndex        =   8
         Top             =   120
         Width           =   4575
      End
   End
   Begin VB.Timer timKeyPress 
      Enabled         =   0   'False
      Interval        =   1000
      Left            =   6120
      Top             =   7680
   End
   Begin VB.CommandButton btnKeyPress 
      Caption         =   "Keypress"
      Height          =   495
      Left            =   4800
      TabIndex        =   0
      Top             =   7680
      Width           =   1335
   End
   Begin VB.Timer TimMoveArrow2 
      Enabled         =   0   'False
      Interval        =   2
      Left            =   6000
      Top             =   2880
   End
   Begin VB.Timer TimSecondsLeft 
      Enabled         =   0   'False
      Interval        =   1000
      Left            =   5160
      Top             =   840
   End
   Begin VB.CommandButton btnTargetLetter 
      DisabledPicture =   "frmMain.frx":0A41
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
      Picture         =   "frmMain.frx":0F43
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
      Top             =   2880
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
      Top             =   7320
      Width           =   3855
   End
   Begin VB.CommandButton btnSourceLetter 
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
      Picture         =   "frmMain.frx":1500
      Style           =   1  'Graphical
      TabIndex        =   2
      Top             =   5640
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
      Visible         =   0   'False
      Width           =   255
   End
   Begin VB.Label lblWordNumber 
      Alignment       =   1  'Right Justify
      BackStyle       =   0  'Transparent
      Caption         =   "1"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   13.5
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00400000&
      Height          =   375
      Index           =   0
      Left            =   5520
      TabIndex        =   3
      Top             =   360
      Width           =   495
   End
   Begin VB.Image imgTargetHolder 
      Height          =   780
      Index           =   0
      Left            =   6000
      Picture         =   "frmMain.frx":1ABD
      Stretch         =   -1  'True
      Top             =   120
      Visible         =   0   'False
      Width           =   765
   End
   Begin VB.Image imgArrow2 
      Height          =   480
      Left            =   5430
      Picture         =   "frmMain.frx":27B0
      Top             =   0
      Width           =   480
   End
   Begin VB.Image imgArrow 
      Height          =   480
      Left            =   5280
      Picture         =   "frmMain.frx":307A
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
Dim SecsXword As Integer
Dim intTotalWords As Integer
Dim bGameinProgress As Boolean
Dim MovingIncrement As Integer
Dim TotalUsedWords As Integer
Dim UsedWord() As String
Dim nLevel As Integer


Private Sub TileBackground()
        Dim pic As Picture
        Dim X%, Y%

        Set pic = Me.Picture
        Y% = 0
        While Y% < Me.Height
                X% = 0
                While X% < Me.Width
                        PaintPicture pic, X%, Y%
                        X% = X% + pic.Width \ 2
                Wend
                Y% = Y% + pic.Height \ 2
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
        Call btnTargetLetter_Click(intLastLetter)
        btnKeyPress.SetFocus
    End If
    
    'if ESC key then remove all buttons
    If KeyAscii = 27 Then
        Call btnTargetLetter_Click((PlayerWordPosition * intMaxWordLen - intMaxWordLen + 1))
    End If
    
    'If space bar click on teh start button
    If KeyAscii = 32 Then
        'Only if more than 2 letters selected
        If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then
            Call btnStart_Click
        End If
        Exit Sub
    End If
    
    For i% = 1 To intTotalSourceLetters
        If btnSourceLetter(i%).Visible = True Then
            If btnSourceLetter(i%).Caption = sLetter Then
                Call btnSourceLetter_Click(i%)
                btnKeyPress.SetFocus
                Exit Sub
            End If
        End If
    Next i%
    
End Sub

Private Sub btnSourceLetter_Click(Index As Integer)
    
    If bGameinProgress = False Then Exit Sub
    
    intLastLetter = intLastLetter + 1
    
    If intLastLetter > PlayerWordPosition * intMaxWordLen Then
        Exit Sub
    End If
    
    'Enable Check Word button if more than 2 letters selected
    If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then btnStart.Enabled = True
    '----------------
    
    Reset_if_Previous_Bad_Word

    btnSourceLetter(Index).Visible = False
    btnTargetLetter(intLastLetter).Caption = btnSourceLetter(Index).Caption
    'Save the source index in the target button in case the user removes the letter
    btnTargetLetter(intLastLetter).Tag = Index
    btnTargetLetter(intLastLetter).Visible = True
    
End Sub

Private Sub btnSourceLetter_MouseDown(Index As Integer, Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = False
End Sub

Private Sub btnSourceLetter_MouseUp(Index As Integer, Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = True
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

Private Sub btnStart_MouseDown(Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = False
End Sub

Private Sub btnStart_MouseUp(Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = True
End Sub

Private Sub btnTargetLetter_Click(Index As Integer)
    Dim SourceIndex As Integer
    Dim i%
    Dim LettersRemoved As Integer
    
    Reset_if_Previous_Bad_Word
    
    For i% = Index To intLastLetter
        SourceIndex = Val(btnTargetLetter(i%).Tag)
        btnTargetLetter(i%).Tag = ""
        btnTargetLetter(i%).Visible = False
        btnSourceLetter(SourceIndex).Visible = True
        
        LettersRemoved = LettersRemoved + 1
    Next
    
    
    intLastLetter = intLastLetter - LettersRemoved
            
    'Enable Check Word button if more than 2 letters selected
    If intLastLetter >= PlayerWordPosition * intMaxWordLen - 4 Then
        btnStart.Enabled = True
    Else
        btnStart.Enabled = False
    End If
    '----------------
End Sub


Private Sub btnTargetLetter_MouseDown(Index As Integer, Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = False
End Sub

Private Sub btnTargetLetter_MouseUp(Index As Integer, Button As Integer, Shift As Integer, X As Single, Y As Single)
    timKeyPress.Enabled = True
End Sub



Private Sub Form_Load()
    Dim i%
    
'    dbFile = AppPath & "\Spanish_to_English.dic"
    dbFile = AppPath & "\English_to_Spanish.dic"

    frmInstructions.Show
    Me.Visible = False
    Pause (0.5)
        
    'FormEx1.ResizeControls = True

    'Game Settings
    intScore = 0
    'seconds per word
    SecsXword = 10
    btnKeyPress.Left = -10000
    
    MovingIncrement = 20
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
        btnSourceLetter(i%).Tag = ""
        btnSourceLetter(i%).Visible = True
    Next i%
    
    Get_Random_Word
    
    
End Sub

Private Sub Form_Unload(Cancel As Integer)
    End
End Sub

Private Sub mnuAdvanced_Click()
    SecsXword = 10
End Sub

Private Sub mnuBeginner_Click()
    SecsXword = 25
End Sub

Private Sub mnuExpert_Click()
    SecsXword = 5
End Sub

Private Sub mnuIntermediate_Click()
    SecsXword = 15
End Sub

Private Sub mnuNovice_Click()
    SecsXword = 20
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
    
    SecondsLeft = SecsXword - ElapsedSeconds
    CurrentWord = ComputerWordPosition - 1
    
    ElapsedSeconds = ElapsedSeconds + 1
    lblTimeLeft.Caption = SecondsLeft


    If lblWordNumber(CurrentWord).ForeColor <> &HC000& Then
        Select Case SecondsLeft
            Case 9
                lblTimeLeft.Visible = True
                lblWordNumber(CurrentWord).ForeColor = vbYellow 'yellow
                lblTimeLeft.ForeColor = vbYellow
            Case 3
                TimFlashNumber.Enabled = True
                lblWordNumber(CurrentWord).ForeColor = vbRed
                lblTimeLeft.ForeColor = vbRed
            Case 0
                TimFlashNumber.Enabled = False
                lblWordNumber(CurrentWord).Visible = True
                lblTimeLeft.Visible = False
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
        'imgArrow.Top = imgTargetHolder(1).Top + (imgArrow.Height / 2)

        timMoveArrow.Enabled = False
        PlayerWordPosition = 1
    Else 'move to the next word
        imgArrow.Top = imgArrow.Top + MovingIncrement
        
        If imgArrow.Top >= lblWordNumber(PlayerWordPosition - 1).Top - 40 Then
            timMoveArrow.Enabled = False
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
    
    btnTargetLetter(0).Left = btnTargetLetter(0).Left - nLeft
    
    For i% = 1 To Total_Items
        Load btnTargetLetter(i%)
        'btnTargetLetter(i%).Visible = True
        btnTargetLetter(i%).ZOrder
    Next i%
            
    For i% = 1 To rowCount
        btnTargetLetter(i%).Left = btnTargetLetter(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To Total_Items
        btnTargetLetter(i%).Move btnTargetLetter(i% - rowCount).Left, btnTargetLetter(i% - rowCount).Top + nTop
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
    
    imgTargetHolder(0).Left = imgTargetHolder(0).Left - nLeft

    
    For i% = 1 To Total_Items
        Load imgTargetHolder(i%)
        imgTargetHolder(i%).Visible = True
        imgTargetHolder(i%).ZOrder
    Next i%
            
    For i% = 1 To rowCount
        imgTargetHolder(i%).Left = imgTargetHolder(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To Total_Items
        imgTargetHolder(i%).Move imgTargetHolder(i% - rowCount).Left, imgTargetHolder(i% - rowCount).Top + nTop
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
        Load btnSourceLetter(i%)
        btnSourceLetter(i%).Caption = ""
        btnSourceLetter(i%).Visible = True
        btnSourceLetter(i%).ZOrder
    Next i%
                    
    For i% = 1 To rowCount
        btnSourceLetter(i%).Left = btnSourceLetter(i% - 1).Left + nLeft
    Next i%
    
    For i% = rowCount + 1 To intTotalSourceLetters
        btnSourceLetter(i%).Top = btnSourceLetter(i% - rowCount).Top + nTop
        btnSourceLetter(i%).Left = btnSourceLetter(i% - rowCount).Left
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
       
    'Disable 2nd Arror temporarly to prevent any the END OF GAME while still checking the word
    TimMoveArrow2.Enabled = False
    
    sWord = ""
    
    'MsgBox PlayerWordPosition * intMaxWordLen - intMaxWordLen + 1 'intLastLetter
    
    For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen + 1 To intLastLetter
        sWord = sWord & btnTargetLetter(i%).Caption
    Next i%
    
    If Was_Word_Used_Before(sWord) = True Then
        Invalid_Word_Msg = "The word """ & sWord & """, was already used, you can not repeat the same words"
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
        
        Call Show_Meaning(sWord)
        
        'Make other target buttons visible but with empty caption to complete word
        For i% = intLastLetter + 1 To PlayerWordPosition * intMaxWordLen
            btnTargetLetter(i%).Caption = ""
            btnTargetLetter(i%).Visible = True
        Next i%
        'Make all target buttons blue and disable them
        For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen To PlayerWordPosition * intMaxWordLen
            btnTargetLetter(i%).BackColor = &H800000
            btnTargetLetter(i%).Enabled = False
        Next i%
        'Count the score based on letters used to create the word
        For i% = (PlayerWordPosition * intMaxWordLen) - intMaxWordLen To intLastLetter
            intScore = intScore + 1
        Next i%
                        
        'Stop the flashing and set color to green
        TimFlashNumber.Enabled = False
        lblTimeLeft.Visible = False
        lblWordNumber(PlayerWordPosition - 1).ForeColor = &HC000&
        lblWordNumber(PlayerWordPosition - 1).Visible = True
                    
        'Show points earned for current word completation
        txtPoints(PlayerWordPosition - 1).Visible = True
        txtPoints(PlayerWordPosition - 1).ZOrder
        txtPoints(PlayerWordPosition - 1).Text = Len(sWord) * 100 & " Points"

        intLastLetter = PlayerWordPosition * intMaxWordLen
        PlayerWordPosition = PlayerWordPosition + 1
        timMoveArrow.Enabled = True
        Get_More_Letters
        btnStart.Enabled = False
        'ElapsedSeconds = 0
        lblScore.Caption = intScore - 1
        lblWord.Caption = sWord
        lblWord.ForeColor = vbGreen
        txtDesc.SelStart = 0
        txtDesc.SelLength = Len(txtDesc.Text)
        txtDesc.SelColor = vbGreen
        
        
        If PlayerWordPosition >= intTotalWords + 1 Then
            Done_With_All_Words
        End If
    Else
        For i% = (PlayerWordPosition * intMaxWordLen) - 6 To intLastLetter
            btnTargetLetter(i%).BackColor = vbRed
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
    
    
End Sub

Private Sub Reset_if_Previous_Bad_Word()
    Dim i%
        
        For i% = (PlayerWordPosition * intMaxWordLen) - (intMaxWordLen - 1) To intLastLetter
            btnTargetLetter(i%).BackColor = &H8000000F
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
        txtDesc.SelColor = vbGreen
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
        
        If imgArrow2.Top >= lblWordNumber(ComputerWordPosition - 1).Top - 40 Then
            TimMoveArrow2.Enabled = False
            lblTimeLeft.Move imgArrow2.Left - 100, imgArrow2.Top + 150
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
    Me.Caption = sWord
    
    TotalSuggestedWords = TotalSuggestedWords + 1
    ReDim Preserve SuggestedWord(TotalSuggestedWords)
    SuggestedWord(TotalSuggestedWords) = sWord
    
    
    'Put letters from sWord on random source buttons
    String_Chars = sWord
    TotalChars = Len(String_Chars)
    
    For i% = 1 To Len(String_Chars)
        Do
            rndButton = Int(Rnd * intTotalSourceLetters) + 1
            If btnSourceLetter(rndButton).Tag = "" Then
                btnSourceLetter(rndButton).Caption = Mid(String_Chars, i%, 1)
                btnSourceLetter(rndButton).Tag = Mid(String_Chars, i%, 1)
                If Is_a_Vowel(btnSourceLetter(rndButton).Caption) Then
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
                If btnSourceLetter(rndButton).Tag = "" Then
                    rndLetter = Int(Rnd * TotalChars) + 1
                    btnSourceLetter(rndButton).Caption = Mid(String_Chars, rndLetter, 1)
                    btnSourceLetter(rndButton).Tag = Mid(String_Chars, rndLetter, 1)
                    Exit Do
                End If
            Loop
        Next i%
    End If
    
    'Add random letters to the rest of the source buttons
    String_Chars = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
    TotalChars = Len(String_Chars)
    For i% = 1 To intTotalSourceLetters
        If btnSourceLetter(i%).Tag = "" Then
            rndLetter = Int(Rnd * TotalChars) + 1
            btnSourceLetter(i%).Caption = Mid(String_Chars, rndLetter, 1)
            btnSourceLetter(i%).Tag = Mid(String_Chars, rndLetter, 1)
        End If
    Next i%
    

End Sub

Private Sub Done_With_All_Words()
    Dim i%
    Dim Total_Items As Integer
    
    nLevel = nLevel + 1
    Call Show_Level
    
    Total_Items = intMaxWordLen * intTotalWords
    
    'Hide Points labels
    For i% = 0 To 9
        txtPoints(i%).Visible = False
    Next i%
    
    For i% = 1 To intTotalSourceLetters
        btnSourceLetter(i%).Tag = ""
        btnSourceLetter(i%).Visible = True
    Next i%
    
    For i% = 1 To Total_Items
        btnTargetLetter(i%).Caption = ""
        btnTargetLetter(i%).Tag = ""
        btnTargetLetter(i%).Visible = False
        btnTargetLetter(i%).Enabled = True
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
    frmShowLevel.Show

    bGameinProgress = True
    PlayerWordPosition = PlayerWordPosition + 1
    btnStart.Caption = "TERMINAR PALABRA"
    btnStart.Enabled = False

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
    frmShowLevel.lblLevel.Caption = "Level " & nLevel
    frmShowLevel.Show 1
End Sub

Private Sub Load_Points_label()
    Dim i%
    
    For i% = 1 To intTotalWords - 1
         Load txtPoints(i%)
         txtPoints(i%).Top = txtPoints(i% - 1).Top + 840
    Next i%
    
End Sub
