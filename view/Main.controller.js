sap.ui.controller("Z_UPDT_ZCFG_TEAM_REGION.view.Main", {
	
	onInit: function() {
		if (sap.ui.Device.support.touch === false) {
			this.getView().addStyleClass("sapUiSizeCompact");
		}
	}
});