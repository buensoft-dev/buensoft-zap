VERSION 5.00
Begin VB.Form frmPoints 
   BackColor       =   &H00E0E0E0&
   BorderStyle     =   3  'Fixed Dialog
   Caption         =   "Your Points"
   ClientHeight    =   6930
   ClientLeft      =   45
   ClientTop       =   435
   ClientWidth     =   7860
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MinButton       =   0   'False
   Picture         =   "frmPoints.frx":0000
   ScaleHeight     =   6930
   ScaleWidth      =   7860
   ShowInTaskbar   =   0   'False
   StartUpPosition =   3  'Windows Default
   Begin VB.ListBox List1 
      BackColor       =   &H00000000&
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   12
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   4560
      Left            =   240
      Style           =   1  'Checkbox
      TabIndex        =   4
      Top             =   1200
      Width           =   2655
   End
   Begin VB.PictureBox Picture1 
      BackColor       =   &H00000000&
      Height          =   4575
      Left            =   3000
      ScaleHeight     =   4515
      ScaleWidth      =   4515
      TabIndex        =   2
      Top             =   1200
      Width           =   4575
      Begin VB.TextBox txtDesc 
         Appearance      =   0  'Flat
         BackColor       =   &H00000000&
         BorderStyle     =   0  'None
         BeginProperty Font 
            Name            =   "Arial"
            Size            =   9.75
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00FFFFFF&
         Height          =   3735
         Left            =   240
         MultiLine       =   -1  'True
         TabIndex        =   6
         Text            =   "frmPoints.frx":11CC82
         Top             =   720
         Width           =   4215
      End
      Begin VB.TextBox txtWord 
         BackColor       =   &H00000000&
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
         ForeColor       =   &H00FFFFFF&
         Height          =   495
         Left            =   120
         TabIndex        =   3
         Text            =   "Text2"
         Top             =   120
         Width           =   4335
      End
   End
   Begin VB.CommandButton btnOK 
      BackColor       =   &H00FFFFFF&
      Caption         =   "OK"
      Height          =   615
      Left            =   6000
      Style           =   1  'Graphical
      TabIndex        =   0
      Top             =   6000
      Width           =   1575
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "Durante todo el juego tuviste la opción de utilizar las siguientes palabras:"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   9.75
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   495
      Left            =   360
      TabIndex        =   5
      Top             =   720
      Width           =   7095
   End
   Begin VB.Label lblExpandVoc 
      Alignment       =   2  'Center
      BackStyle       =   0  'Transparent
      Caption         =   "Expande tu vocabulario"
      BeginProperty Font 
         Name            =   "Arial"
         Size            =   24
         Charset         =   0
         Weight          =   400
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H00FFFFFF&
      Height          =   495
      Left            =   240
      TabIndex        =   1
      Top             =   120
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

Private Sub lblCaption_Click()

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

