var gDeleteTeamId;
var that;

jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");
jQuery.sap.require("sap.m.TablePersoController");
jQuery.sap.require("sap.ui.commons.MessageBox");
jQuery.sap.require("sap.ui.core.util.Export");
jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");

sap.ui.define([
	"Z_UPDT_ZCFG_TEAM_REGION/view/BaseController",
	"sap/ui/model/json/JSONModel",
	"Z_UPDT_ZCFG_TEAM_REGION/model/formatter"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	BaseController.gChangedRecordArr = []; //Works like a Global Variable
	return BaseController.extend("Z_UPDT_ZCFG_TEAM_REGION.view.Master", {

		_oCatalog: null,
		_oResourceBundle: null,

		onInit: function() {
			that = this;
			this._oView = this.getView();
			var oItemTemplate = this.byId("columnListItem").clone();
			this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this._oView));
			this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();
			this._oRouter = this._oComponent.getRouter();
			this._oCatalog = this.byId("teamTable");
			this._initViewPropertiesModel();

			//Initialize dropdown to current year.
			var currentyear = new Date().getFullYear();
			this.byId("selectYear").setSelectedKey(currentyear);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle, oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");

			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this._oResourceBundle.getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this._oResourceBundle.getText("worklistTableTitle");
			}

			this.getView().byId("title").setText(sTitle);

		},

		// The model created here is used to set values or view element properties that cannot be bound
		// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
		// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
		// robust if the customer removes view elements (see extensibility).
		_initViewPropertiesModel: function() {
			var oViewElemProperties = {};
			oViewElemProperties.catalogTitleText = "ZCFG_TEAM_REGIONSet";
			if (sap.ui.Device.system.phone) {

				oViewElemProperties.availabilityColumnWidth = "80%";
				oViewElemProperties.pictureColumnWidth = "5rem";
				oViewElemProperties.btnColHeaderVisible = true;
				oViewElemProperties.searchFieldWidth = "100%";
				oViewElemProperties.catalogTitleVisible = false;
				// in phone mode the spacer is removed in order to increase the size of the search field
				this.byId("tableToolbar").removeContent(this.byId("toolbarSpacer"));
			} else {
				oViewElemProperties.availabilityColumnWidth = "18%";
				oViewElemProperties.pictureColumnWidth = "9%";
				oViewElemProperties.btnColHeaderVisible = false;
				oViewElemProperties.searchFieldWidth = "30%";
				oViewElemProperties.catalogTitleVisible = true;
			}
			this._oViewProperties = new sap.ui.model.json.JSONModel(oViewElemProperties);
			this._oView.setModel(this._oViewProperties, "viewProperties");
		},

		getDialog: function() {
			if (!this.dialog) {
				// This fragment can be instantiated from a controller as follows:  
				this.dialog = sap.ui.xmlfragment("fragPopupDialog", "Z_UPDT_ZCFG_TEAM_REGION.view.Dialog", this);
			}
			return this.dialog;
		},

		/**
		 * Event handler for getting 'Add' Dialog started
		 * @public
		 */
		handleOpenDialogAdd: function(evt) {
			//var oSelectedItem = evt.getSource();
			this.getDialogAdd().open(); // get the reference of input fields of fragment and set the values  

			//Initialize dropdown to current year.
			var currentyear = new Date().getFullYear();
			//this.byId("selectYear").setSelectedKey(currentyear);
			sap.ui.getCore().byId("fragPopupDialog--idDataYear").setSelectedKey(currentyear);

		},

		/**
		 * Event handler for getting 'Add' Dialog started
		 * @public
		 */
		getDialogAdd: function() {
			if (!this.dialog) {
				// This fragment can be instantiated from a controller as follows:  
				this.dialog = sap.ui.xmlfragment("fragPopupDialog", "Z_UPDT_ZCFG_TEAM_REGION.view.DialogAdd", this);
			}
			return this.dialog;
		},

		handleOpenDialog: function(evt) {
			//alert('test');
			var oSelectedItem = evt.getSource();
			var valTeamId = oSelectedItem.getBindingContext().getProperty("TeamId");
			var valWrmAdjDays = oSelectedItem.getBindingContext().getProperty("TeamWrmAdjDays");
			var valNotes = oSelectedItem.getBindingContext().getProperty("Notes");

			var strDateFrom = oSelectedItem.getBindingContext().getProperty("DateFrom");
			//alert(strDateFrom);
			//var valDateFrom = oSelectedItem.getBindingContext().getProperty("DateFrom");
			var valDataYear = oSelectedItem.getBindingContext().getProperty("DataYear");

			// get the fragment  
			this.getDialog().open();

			// get the reference of input fields of fragment and set the values  
			sap.ui.getCore().byId("fragPopupDialog--idTeamId").setValue(valTeamId);
			sap.ui.getCore().byId("fragPopupDialog--idAdjustmentDays").setValue(valWrmAdjDays);
			sap.ui.getCore().byId("fragPopupDialog--idNotes").setValue(valNotes);
			//New-Feb2

			sap.ui.getCore().byId("fragPopupDialog--idDataYear").setValue(valDataYear);
		},

		onNavBack: function() {
			window.history.go(-1);
		},

		// --- Search
		onSearchPressed: function() {

			var newFilters = [];
			var searchString = this.byId("searchField").getValue();
			var oTable = this.byId("teamTable");
			var binding = oTable.getBinding("items");

			//Format Search String
			searchString = '%' + searchString + '%';

			//Add Search String to Filter parameter
			var filter = new sap.ui.model.Filter("TeamId", sap.ui.model.FilterOperator.EQ, searchString);
			newFilters.push(filter);

			//Also add year filter while searching:
			var selectedYear = this.byId("selectYear").getSelectedKey(); //.getValue(); .getSelectedKey();
			var filteryear = new sap.ui.model.Filter("DataYear", sap.ui.model.FilterOperator.EQ, selectedYear);
			newFilters.push(filteryear);

			//Attach Filters to request
			binding.filter(newFilters);
			binding.applyFilter(newFilters);

		},

		// --- Year Select
		onYearSelect: function() {
			var selectedYear = this.byId("selectYear").getSelectedKey(); //.getValue(); .getSelectedKey();

			//Add Year to Filter parameter
			var newFilters = [];
			var oTable = this.byId("teamTable");
			var binding = oTable.getBinding("items");

			var filter = new sap.ui.model.Filter("DataYear", sap.ui.model.FilterOperator.EQ, selectedYear);
			newFilters.push(filter);
			binding.filter(newFilters);
			binding.applyFilter(newFilters);
		},

		// --- Cancel
		Cancel: function() {
			sap.ui.getCore().byId("Dialog").close();
		},

		closeDialog: function() {
			this.getDialog().close();
		},

		onAdd: function() {

			//Get Parameter values to update
			//var oTeamId = sap.ui.getCore().byId("fragPopupDialog--idTeamId").getValue();
			//var oWrmAdjDays = sap.ui.getCore().byId("fragPopupDialog--idAdjustmentDays").getValue();
			//var oNotes = sap.ui.getCore().byId("fragPopupDialog--idNotes").getValue();
			//var oDataYear = sap.ui.getCore().byId("fragPopupDialog--idDataYear").getValue();

			//Start prepairing input Entry
			var oEntry = {};
			oEntry.TeamId = sap.ui.getCore().byId("fragPopupDialog--idTeamId").getValue();
			oEntry.TeamWrmAdjDays = sap.ui.getCore().byId("fragPopupDialog--idAdjustmentDays").getValue();
			oEntry.Notes = sap.ui.getCore().byId("fragPopupDialog--idNotes").getValue();
			oEntry.DataYear = sap.ui.getCore().byId("fragPopupDialog--idDataYear").getSelectedItem().getText();

			//VALIDATIONS
			if (oEntry.oWrmAdjDays === null || oEntry.oWrmAdjDays === "") {
				oEntry.oWrmAdjDays = "0";
			}

			//VALIDATIONS
			if (oEntry.TeamId.trim().length === 0) {
				sap.ui.getCore().getControl("fragPopupDialog--idTeamId").setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().getControl("fragPopupDialog--idTeamId").setValueStateText("Please Enter Team ID");
				sap.m.MessageToast.show("Please enter some value for Team ID...");
				return;
			}

			//Get Model
			var oModel = this.getOwnerComponent().getModel();
			oModel.create("/ZCFG_TEAM_REGIONSet", oEntry, {
				success: function(oData, oResponse) {
					sap.m.MessageToast.show("Record Created");
					oModel.updateBindings();
				},
				error: function(oError) {
					sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
					oModel.refresh();
				}
			});
			this.closeDialog();

			//Get Model; @TODO: try to get the Model Name programatically
			/*
			var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/Z_TEAM_REGION_SRV/", true);
			oModel.update("/ZCFG_TEAM_REGIONSet('" + oEntry.TeamId + "')", oEntry, {

				success: function() {

					//Refresh View
					var thisview = sap.ui.getCore().byId("MasterView"); //FYI: We Set the dedicated XML view name in Component.js file to "MasterView"
					thisview.getModel().refresh(true);
					sap.m.MessageToast.show("Saved!"); //Display Message
				},
				error: function() {
					sap.m.MessageToast.show("Error!"); //Display Message
				}
			});
			*/

			//	this.getDialog().close();
		},

		onSave: function() {
			//alert("save called....");
			//Get Parameter values to update
			var oTeamId = sap.ui.getCore().byId("fragPopupDialog--idTeamId").getValue();
			var oWrmAdjDays = sap.ui.getCore().byId("fragPopupDialog--idAdjustmentDays").getValue();
			var oNotes = sap.ui.getCore().byId("fragPopupDialog--idNotes").getValue();
			var oDataYear = sap.ui.getCore().byId("fragPopupDialog--idDataYear").getValue();

			//Start prepairing input Entry
			var oEntry = {};
			oEntry.TeamId = oTeamId;

			if (oWrmAdjDays === null || oWrmAdjDays === "") {
				oWrmAdjDays = "0";
			}

			oEntry.TeamWrmAdjDays = oWrmAdjDays;
			oEntry.Notes = oNotes;
			oEntry.DataYear = oDataYear;

			//Get Model; @TODO: try to get the Model Name programatically
			var oModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/Z_TEAM_REGION_SRV/", true);
			oModel.update("/ZCFG_TEAM_REGIONSet('" + oEntry.TeamId + "')", oEntry, {

				success: function() {

					//Refresh View
					var thisview = sap.ui.getCore().byId("MasterView"); //FYI: We Set the dedicated XML view name in Component.js file to "MasterView"
					thisview.getModel().refresh(true);
					sap.m.MessageToast.show("Saved!"); //Display Message
				},
				error: function() {
					sap.m.MessageToast.show("Error!"); //Display Message
				}
			});

			this.getDialog().close();
		},

		/**
		 * Handle Save All Button Event
		 * Check which records have been changed, and update the Model in batch
		 * @public
		 */
		onSaveAll: function() {

			var oModel = this.getOwnerComponent().getModel();
			//	oModel.setDeferredGroups(["updateRecsGrpId"]);

			var oTable = that.getView().byId("teamTable");
			//var a = 0;

			//Loop through entire table, and add changed records in 

			oTable.getItems().forEach(function(row) {
				var oEntry = {};
				var obj = row.getBindingContext().getObject();
				if (BaseController.gChangedRecordArr.indexOf(obj.TeamId) > -1) { //If record was changed
					//if (obj.InspId ) {

					var cells = row.getCells();
					//console.log(cells);
					//console.log(cells[3].getAccessibilityInfo());
					//console.log(cells[3].getMetadata());

					oEntry.TeamId = cells[0].getText();
					oEntry.DataYear = cells[1].getText();
					oEntry.TeamWrmAdjDays = cells[2].getValue();

					if (oEntry.TeamWrmAdjDays === null || oEntry.TeamWrmAdjDays === "") {
						oEntry.TeamWrmAdjDays = "0";
					}

					oEntry.Notes = cells[3].getValue();

					////alert("INSP: " + oEntry.InspId);
					//console.log(oEntry);
					oModel.update("/ZCFG_TEAM_REGIONSet('" + oEntry.TeamId + "')", oEntry, {
						groupId: "updateRecsGrpId",
						changeSetId: "TeamChangeID"
					});
				}
			});

			oModel.submitChanges({
				groupId: "updateRecsGrpId",

				success: function(oData, oResponse) {
					//	that.onNavBack();
					BaseController.gChangedRecordArr = [];
					//oModel.refresh();
					sap.m.MessageToast.show("Records Updated");
				},
				error: function(oError) {
					//sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
					sap.m.MessageToast.show("Record Not Updated. Please check with Admin.");
					///oModel.refresh();

					//return;
				}
			});

		},

		/**
		 *@ Value changed for a field. add Inspector ID to array, so we can update all together in SaveAll method.
		 */
		onFieldValueChange: function(oControlEvent) {

			//This code was generated by the layout editor.
			//var oSelectedItem = oControlEvent.getSource();

			var obj = oControlEvent.getSource().getBindingContext().getObject();
			///console.log(oControlEvent.getSource().getBindingContext().getPath()); //gets the current index of your table row                

			//Add Change Inspector to Array
			BaseController.gChangedRecordArr.push(obj.TeamId);
			//console.log(gChangedRecordArr);

			//alert(obj.TeamWrmAdjDays);
			//	if (obj.TeamWrmAdjDays === null || obj.TeamWrmAdjDays === "" ) {
			//			obj.TeamWrmAdjDays = "0";
			//	}

		},

		/**
		 * Handle Inspector Delete Event
		 * Popupp Confirmation
		 * @public
		 */
		onDeletePress: function(oEvent) {
			//This code was generated by the layout editor.
			var oSelectedItem = oEvent.getParameter("listItem");
			var sItemName = oSelectedItem.getBindingContext().getProperty("TeamId");

			gDeleteTeamId = sItemName;
			sap.ui.commons.MessageBox.confirm("Remove Record for Inspector:" + sItemName + "'?", this.doDelete);
		},

		/**
		 * Perform Deletion of Inspector
		 * @public
		 */
		doDelete: function(sResult) {

			if (sResult === true) {

				var oModel = that.getOwnerComponent().getModel();
				//alert(oModel);

				oModel.remove("/ZCFG_TEAM_REGIONSet('" + gDeleteTeamId + "')", {
					success: function(oData, oResponse) {
						//that.onNavBack();
						gDeleteTeamId = '';
						sap.m.MessageToast.show("Record Deleted...");
						//oModel.refresh();
						oModel.updateBindings();

					},
					error: function(oError) {
						gDeleteTeamId = '';
						sap.m.MessageToast.show("Record Not Deleted. Please check with Admin.");
						//sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
						oModel.refresh();
					}
				});
			}
		},

		/*********************************************************************************************
		 * Handle Export to CSV event
		 */
		onDataExport: sap.m.Table.prototype.exportData || function(oEvent) {

			var oExport = new sap.ui.core.util.Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType: new sap.ui.core.util.ExportTypeCSV({
					//separatorChar: ";"
					separatorChar: ",",
					charset: "utf-8"
				}),

				// Pass in the model created above
				models: this.getView().getModel(),

				// binding information for the rows aggregation
				rows: {
					path: "/ZCFG_TEAM_REGIONSet"
				},

				// column definitions with column name and binding info for the content

				columns: [{
					name: "Team ID",
					template: {
						content: "{TeamId}"
					}
				}, {
					name: "Year",
					template: {
						content: "{DataYear}"
					}
				}, {
					name: "Adjustment Days",
					template: {
						content: "{TeamWrmAdjDays}"
					}
				}, {
					name: "Notes",
					template: {
						content: "{Notes}"
					}
				}]
			});

			// download exported file
			oExport.saveFile().catch(function(oError) {
				sap.ui.commons.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		}

	});
});