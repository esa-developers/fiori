// define a root UI component that exposes the main view
/*global Z_MANG_INSP_DT*/

jQuery.sap.declare("Z_MANG_INSP_DT.Component");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ui.core.routing.History");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
sap.ui.core.UIComponent.extend("Z_MANG_INSP_DT.Component", {
	metadata: {
		"name": "Z_MANG_INSP_DT",
		"version": "1.1.0-SNAPSHOT",
		"library": "Z_MANG_INSP_DT",
		"includes": ["css/fullScreenStyles.css"],
		"dependencies": {
			"libs": [
				"sap.m",
				"sap.ui.layout"
			],
			"components": []
		},
		"config": {
			"resourceBundle": "i18n/i18n.properties",
			"serviceConfig": {
				"name": "Z_INSPECTOR_ADNL_DATA_SRV",
				"serviceUrl": "/sap/opu/odata/sap/Z_INSPECTOR_ADNL_DATA_SRV/"
			},
			"serviceConfig2": {
				"name": "Z_SEARCH_HELP_SRV",
				"serviceUrl": "/sap/opu/odata/sap/Z_SEARCH_HELP_SRV/"
			}
		},
		routing: {
			// The default values for routes
			config: {
				"viewType": "XML",
				"viewPath": "Z_MANG_INSP_DT.view",
				"targetControl": "fioriContent",
				// This is the control in which new views are placed
				"targetAggregation": "pages",
				// This is the aggregation in which the new views will be placed
				"clearTarget": false,
				viewId: "MasterView"
			},
			routes: [{
				pattern: "",
				name: "main",
				view: "Master"
			}, {
				name: "details",
				view: "Details",
				pattern: "{entity}"
			}]
		}
	},
	/**
	 * Initialize the application
	 * 
	 * @returns {sap.ui.core.Control} the content
	 */
	createContent: function() {
		var oViewData = {
			component: this
		};
		return sap.ui.view({
			viewName: "Z_MANG_INSP_DT.view.Main",
			type: sap.ui.core.mvc.ViewType.XML,
			viewData: oViewData
		});
	},
	init: function() {
		var that = this;
		// call super init (will call function "create content")
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
		// always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var sRootPath = jQuery.sap.getModulePath("Z_MANG_INSP_DT");
		// The service URL for the oData model 
		var oServiceConfig = this.getMetadata().getConfig().serviceConfig;
		var sServiceUrl = oServiceConfig.serviceUrl;
		//alert(sServiceUrl);
		// the metadata is read to get the location of the i18n language files later
		var mConfig = this.getMetadata().getConfig();
		this._routeMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter(), this._bRouterCloseDialogs);
		// create oData model
		this._initODataModel(sServiceUrl);
		// set i18n model
		
		var sServiceUrl2 = this.getMetadata().getConfig().serviceConfig2.serviceUrl;
		this._initODataModel(sServiceUrl2, "sh_model");		
		
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [
				sRootPath,
				mConfig.resourceBundle
			].join("/")
		});
		this.setModel(i18nModel, "i18n");
		// initialize router and navigate to the first page
		this.getRouter().initialize();
	},
	exit: function() {
		this._routeMatchedHandler.destroy();
	},
	// This method lets the app can decide if a navigation closes all open dialogs
	setRouterSetCloseDialogs: function(bCloseDialogs) {
		this._bRouterCloseDialogs = bCloseDialogs;
		if (this._routeMatchedHandler) {
			this._routeMatchedHandler.setCloseDialogs(bCloseDialogs);
		}
	},
	// creation and setup of the oData model
	_initODataModel: function(sServiceUrl, modelname) {
		jQuery.sap.require("Z_MANG_INSP_DT.util.messages");
		var oConfig = {
			metadataUrlParams: {},
			json: true,
			// loadMetadataAsync : true,
			defaultBindingMode: "TwoWay",
			defaultCountMode: "Inline",
			useBatch: true
		};
		var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, oConfig);
		oModel.attachRequestFailed(null, Z_MANG_INSP_DT.util.messages.showErrorMessage);
		if (modelname == null) {
			this.setModel(oModel);
		} else {
			this.setModel(oModel, modelname);
		}
		
		//New - To batch requests
		oModel.setDeferredGroups(["updateRecsGrpId"]);
		oModel.setChangeGroups({
			"ZCFG_INSPECTOR": {
				groupId: "updateRecsGrpId",
				changeSetId: "InspChangeID",
				single: false
			}
		});		
		
		
	}
});