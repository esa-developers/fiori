/*global Z_MANG_INSP_DT*/

jQuery.sap.declare("Z_MANG_INSP_DT.util.messages");
jQuery.sap.require("sap.ca.ui.message.message");

Z_MANG_INSP_DT.util.messages = {};

/**
 * Show an error dialog with information from the oData response object.
 *
 * @param {object}
 *            oParameter The object containing error information
 * @return {void}
 * @public
 */
Z_MANG_INSP_DT.util.messages.showErrorMessage = function(oParameter) {
	var oErrorDetails = Z_MANG_INSP_DT.util.messages._parseError(oParameter);
	var oMsgBox = sap.ca.ui.message.showMessageBox({
		type: sap.ca.ui.message.Type.ERROR,
		message: oErrorDetails.sMessage,
		details: oErrorDetails.sDetails
	});
	if (!sap.ui.Device.support.touch) {
		oMsgBox.addStyleClass("sapUiSizeCompact");
	}
};

Z_MANG_INSP_DT.util.messages.getErrorContent = function(oParameter) {
	return Z_MANG_INSP_DT.util.messages._parseError(oParameter).sMessage;
};

Z_MANG_INSP_DT.util.messages._parseError = function(oParameter) {
	var sMessage = "",
		sDetails = "",
		oEvent = null,
		oResponse = null,
		oError = {};

/*
	if (oParameter.mParameters) {
		oEvent = oParameter;
		sMessage = oEvent.getParameter("message");
		sDetails = oEvent.getParameter("responseText");
	} else {
		oResponse = oParameter;
		sMessage = oResponse.message;
		sDetails = oResponse.response.body;
	}
*/
	if (jQuery.sap.startsWith(sDetails, "{\"error\":")) {
		var oErrModel = new sap.ui.model.json.JSONModel();
		oErrModel.setJSON(sDetails);
		sMessage = oErrModel.getProperty("/error/message/value");
	}

	oError.sDetails = sDetails;
	oError.sMessage = sMessage;
	return oError;
};