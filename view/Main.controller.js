sap.ui.controller("Z_MANG_INSP_DT.view.Main", {

	onInit: function() {
		if (sap.ui.Device.support.touch === false) {
			this.getView().addStyleClass("sapUiSizeCompact");
		}
	}
});