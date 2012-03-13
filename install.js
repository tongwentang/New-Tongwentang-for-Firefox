const X_VERSION		= "0.4.0.9.2";
const X_MSG			= "\u65b0\u540c\u6587\u5802(New Tong Wen Tang)";
const X_NAME		= "/hashao/tongwen";
const X_AUTH		= "hashao"
const X_JAR_FILE 	= "tongwen.jar";
const X_JAR_DIR		= "chrome/";
const X_JAR_PATH	= X_JAR_DIR + X_JAR_FILE;
const X_HOME		= "tongwen";

const contentuser       = PROFILE_CHROME;
const contentsys        = DELAYED_CHROME;


var chromeFlag = contentuser;
var installDir = getFolder("Profile", "chrome");
var existsInApplication = File.exists(getFolder(getFolder("chrome"), X_JAR_FILE));
var existsInProfile     = File.exists(getFolder(installDir, X_JAR_FILE));

var error = null;

initInstall(X_MSG, X_NAME, X_VERSION);

if (existsInApplication || existsInProfile)
    error = uninstall(X_NAME);
if (error != SUCCESS) {
    error = deleteRegisteredFile(X_NAME);
    error = SUCCESS;
}

function append_toolbar(pbutton) {
    var doc = window;
    var palette = document.getElementById('nav-bar');
    alert(palette.getAttribute("defaultset"));
}

/* 
   Install to user chosen profile chrome. 
   If already installed system wide before, use the default place.
*/
//if(existsInApplication || (!existsInProfile && 
if (!confirm("Do you want to install the extension into your profile folder?\n(Cancel will install into the application folder)")){
    chromeFlag = contentsys;
    installDir = getFolder("chrome");
}


setPackageFolder(installDir);

error = addFile(X_NAME, X_VERSION, X_JAR_PATH, installDir, null);
if(error == SUCCESS) {
    var tmpfolder = getFolder(installDir, X_JAR_FILE);
    registerChrome(CONTENT|chromeFlag, tmpfolder, "content/tongwen/");
    registerChrome(LOCALE|chromeFlag, tmpfolder, "locale/en-US/tongwen/");
    registerChrome(LOCALE|chromeFlag, tmpfolder, "locale/zh-CN/tongwen/");
    registerChrome(LOCALE|chromeFlag, tmpfolder, "locale/zh-TW/tongwen/");
    registerChrome(SKIN|chromeFlag, tmpfolder, "skin/classic/tongwen/");
    if (error == SUCCESS)
	error = performInstall();
}
if (error == SUCCESS || error == REBOOT_NEEDED) {
    var header = "";
    if (error == REBOOT_NEEDED)
	header = ("The files were installed, but one or more components were in use. Restart the computer and Communicator to complete the installation process. On Windows NT, you may only need to restart Communicator as long as you did not replace operating system files.\n"); 
     alert(header + "If you are using FireFox, you need to add \"tongwen\" \nbutton to the toolbar (View->Toolbars->Customize..., drag and drop.)");
     //append_toolbar("tongwen-button");
} else{
    // see error codes:
    var txt = "\nThe meaning of the error code can be found at \n http://devedge.netscape.com/library/manuals/2001/xpinstall/1.0/err.html";
    alert("The installation failed with an error code: " + error + "\n" + 
	errStr(error));
    cancelInstall(error);
}


function errStr(error) {
    var retval;
    switch (error) {
	case Install.SUCCESS:
	    retval = "Success";
	    break;

	case Install.REBOOT_NEEDED:
	    retval = "Reboot Needed";
	    break;

	case Install.BAD_PACKAGE_NAME:
	    retval = "Bad Package Name";
	    break;

	case Install.UNEXPECTED_ERROR:
	    retval = "Unexpected Error";
	    break;

	case Install.ACCESS_DENIED:
	    retval = "Access Denied";
	    break;

	case Install.TOO_MANY_CERTIFICATES:
	    retval = "Too Many Certificates";
	    break;

	case Install.NO_INSTALL_SCRIPT:
	    retval = "No Install Script";
	    break;

	case Install.NO_CERTIFICATE:
	    retval = "No Certificate";
	    break;

	case Install.NO_MATCHING_CERTIFICATE:
	    retval = "No Matching Certificate";
	    break;

	case Install.CANT_READ_ARCHIVE:
	    retval = "Cant Read Archive";
	    break;

	case Install.INVALID_ARGUMENTS:
	    retval = "Invalid Arguments";
	    break;

	case Install.ILLEGAL_RELATIVE_PATH:
	    retval = "Illegal Relative Path";
	    break;

	case Install.USER_CANCELLED:
	    retval = "User Cancelled";
	    break;

	case Install.INSTALL_NOT_STARTED:
	    retval = "Install Not Started";
	    break;

	case Install.SILENT_MODE_DENIED:
	    retval = "Silent Mode Denied";
	    break;

	case Install.NO_SUCH_COMPONENT:
	    retval = "No Such Component";
	    break;

	case Install.DOES_NOT_EXIST:
	    retval = "Does Not Exist";
	    break;

	case Install.READ_ONLY:
	    retval = "Read Only";
	    break;

	case Install.IS_DIRECTORY:
	    retval = "Is Directory";
	    break;

	case Install.NETWORK_FILE_IS_IN_USE:
	    retval = "Network File Is In Use";
	    break;

	case Install.APPLE_SINGLE_ERR:
	    retval = "Apple Single Err";
	    break;

	case Install.INVALID_PATH_ERR:
	    retval = "Invalid Path Err";
	    break;

	case Install.PATCH_BAD_DIFF:
	    retval = "Patch Bad Diff";
	    break;

	case Install.PATCH_BAD_CHECKSUM_TARGET:
	    retval = "Patch Bad Checksum Target";
	    break;

	case Install.PATCH_BAD_CHECKSUM_RESULT:
	    retval = "Patch Bad Checksum Result";
	    break;

	case Install.UNINSTALL_FAILED:
	    retval = "Uninstall Failed";
	    break;

	case Install.PACKAGE_FOLDER_NOT_SET:
	    retval = "Package Folder Not Set";
	    break;

	case Install.EXTRACTION_FAILED:
	    retval = "Extraction Failed";
	    break;

	case Install.FILENAME_ALREADY_USED:
	    retval = "Filename Already Used";
	    break;

	case Install.INSTALL_CANCELLED:
	    retval = "Install Cancelled";
	    break;

	case Install.DOWNLOAD_ERROR:
	    retval = "Download Error";
	    break;

	case Install.SCRIPT_ERROR:
	    retval = "Script Error";
	    break;

	case Install.ALREADY_EXISTS:
	    retval = "Already Exists";
	    break;

	case Install.IS_FILE:
	    retval = "Is File";
	    break;

	case Install.SOURCE_DOES_NOT_EXIST:
	    retval = "Source Does Not Exist";
	    break;

	case Install.SOURCE_IS_DIRECTORY:
	    retval = "Source Is Directory";
	    break;

	case Install.SOURCE_IS_FILE:
	    retval = "Source Is File";
	    break;

	case Install.INSUFFICIENT_DISK_SPACE:
	    retval = "Insufficient Disk Space";
	    break;

	case Install.FILENAME_TOO_LONG:
	    retval = "Filename Too Long";
	    break;

	case Install.UNABLE_TO_LOCATE_LIB_FUNCTION:
	    retval = "Unable To Locate Lib Function";
	    break;

	case Install.UNABLE_TO_LOAD_LIBRARY:
	    retval = "Unable To Load Library";
	    break;

	case Install.CHROME_REGISTRY_ERROR:
	    retval = "Chrome Registry Error";
	    break;

	case Install.MALFORMED_INSTALL:
	    retval = "Malformed Install";
	    break;

	case Install.OUT_OF_MEMORY:
	    retval = "Out Of Memory";
	    break;

	case Install.GESTALT_UNKNOWN_ERROR:
	    retval = "Gestalt Unknown Error";
	    break;

	case Install.GESTALT_INVALID_ARGUMENT:
	    retval = "Gestalt Invalid Argument";
	    break;
	default:
	    retval = "Unknown Error";
    }
    return retval;
}
