VERSION 5.00
Object = "{3B7C8863-D78F-101B-B9B5-04021C009402}#1.2#0"; "richtx32.ocx"
Begin VB.Form frmPoints 
   Caption         =   "Your Points"
   ClientHeight    =   6075
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   7815
   LinkTopic       =   "Form1"
   ScaleHeight     =   6075
   ScaleWidth      =   7815
   StartUpPosition =   3  'Windows Default
   Begin VB.ListBox List1 
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   4260
      Left            =   240
      Style           =   1  'Checkbox
      TabIndex        =   4
      Top             =   840
      Width           =   2775
   End
   Begin VB.PictureBox Picture1 
      BackColor       =   &H00FFFFFF&
      Height          =   4215
      Left            =   3000
      ScaleHeight     =   4155
      ScaleWidth      =   4515
      TabIndex        =   2
      Top             =   840
      Width           =   4575
      Begin RichTextLib.RichTextBox txtDesc 
         Height          =   3135
         Left            =   120
         TabIndex        =   5
         Top             =   720
         Width           =   4335
         _ExtentX        =   7646
         _ExtentY        =   5530
         _Version        =   393217
         BorderStyle     =   0
         Enabled         =   -1  'True
         Appearance      =   0
         TextRTF         =   $"frmPoints.frx":0000
         BeginProperty Font {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   9.75
            Charset         =   0
            Weight          =   400
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
      End
      Begin VB.TextBox txtWord 
         BorderStyle     =   0  'None
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   21.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FF0000&
         Height          =   495
         Left            =   120
         TabIndex        =   3
         Text            =   "Text2"
         Top             =   120
         Width           =   4335
      End
   End
   Begin VB.CommandButton btnOK 
      Caption         =   "OK"
      Height          =   615
      Left            =   6000
      TabIndex        =   0
      Top             =   5280
      Width           =   1575
   End
   Begin VB.Label lblCaption 
      Caption         =   "Expand your vocabulary. You could have used the following words:"
      Height          =   495
      Left            =   240
      TabIndex        =   1
      Top             =   240
      Width           =   7095
   End
End
Attribute VB_Name = "frmPoints"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Sub btnOK_Click()
    Unload Me
End Sub

Private Sub Form_Load()
    For i% = 1 To TotalSuggestedWords
        List1.AddItem SuggestedWord(i%)
    Next i%
    
End Sub

Private Sub List1_Click()
    Dim oConn As New ADODB.Connection
    Dim oRs As New ADODB.Recordset
    Dim sQuery As String
    Dim sWord As String
    
    sWord = List1.Text
    
    oConn.Open "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" & dbFile & ";Jet OLEDB:Database Password=bsf3572;"
    sQuery = "SELECT * FROM tblDictionary WHERE tWord = '" & sWord & "'"
    oRs.Open sQuery, oConn, adOpenKeyset, adLockReadOnly
       
    
    If oRs.BOF <> True And oRs.EOF <> True Then
        txtWord = sWord
        txtDesc.Text = oRs!tMeaning & ""
    End If
    
    oRs.Close
    oConn.Close


End Sub

