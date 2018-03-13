var that;
var gDeleteInspId;
var gChangedInspsArr = [];
jQuery.sap.require("sap.ui.commons.MessageBox");
sap.ui.define([
	"Z_MANG_INSP_DT/view/BaseController",
	"sap/ui/model/json/JSONModel",
	"Z_MANG_INSP_DT/model/formatter",
	"sap/ui/core/util/Export",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/util/ExportTypeCSV"
], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("Z_MANG_INSP_DT.view.Master", {

		formatter: formatter,
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			that = this;
			var oViewModel, iOriginalBusyDelay, oTable = this.byId("inspTable");
			// Put down worklist table's original value for busy indicator delay,
			// so it can be restored later on. Busy handling on the table is
			// taken care of by the table itself.
			iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
			// keeps the search state
			this._aTableSearchState = [];
			// Model used to manipulate control states
			oViewModel = new JSONModel({

				worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
				saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
				shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
				shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
				shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
				tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
				tableBusyDelay: 0
			});
			this.setModel(oViewModel, "worklistView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for worklist's table
				oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
			});
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
			//alert(iTotalItems);
			//alert(oTable._getRowCount());
			//alert(oTable.getBinding("items").getLength());
			// only update the counter if the length is final and
			// the table is not empty
			/*
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				alert("len final");
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				alert("len Not final");
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			*/

			sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			this.getView().byId("title").setText(sTitle);
			//this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},
		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("worklistView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");
				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new sap.ui.model.Filter("InspId", sap.ui.model.FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}
		},
		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			var oTable = this.byId("inspTable");
			oTable.getBinding("items").refresh();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject: function(oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("InspId")
			});
		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("inspTable"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},

		/* *******************************************************************************************************/
		/*==============================   C U S T O M     -    S T A R T =======================================*/
		/* *******************************************************************************************************/

		/**
		 * Event handler for getting 'Add' Dialog started
		 * @public
		 */
		getDialogAdd: function() {
			if (!this.dialog) {
				// This fragment can be instantiated from a controller as follows:  
				this.dialog = sap.ui.xmlfragment("fragPopupDialog", "Z_MANG_INSP_DT.view.DialogAdd", this);
			}
			return this.dialog;
		},

		/**
		 * Close Dialog Box
		 * @public
		 */
		closeDialog: function() {
			this.getDialogAdd().close();
		},

		/**
		 * Event handler for getting 'Add' Dialog started
		 * @public
		 */
		handleOpenDialog: function(evt) {
			//var oSelectedItem = evt.getSource();
			this.getDialogAdd().open(); // get the reference of input fields of fragment and set the values  
		},

		/**
		 * Handle Save event for New Inspector
		 * @public
		 */
		onAdd: function() {
			//Start prepairing input Entry
			var oEntry = {};
			//var content = formAdd.getContent();
			var content = sap.ui.getCore().byId("fragPopupDialog--formAdd").getContent();
			oEntry.InspId = sap.ui.getCore().byId("fragPopupDialog--i_INSP_ID").getValue();
			oEntry.WrmCountExclude = sap.ui.getCore().byId("fragPopupDialog--i_WRM_COUNT_EXCLUDE").getSelected();
			oEntry.WrmAvailDaysOvr = sap.ui.getCore().byId("fragPopupDialog--i_WRM_AVAIL_DAYS_OVR").getValue();
			oEntry.VacationDays = sap.ui.getCore().byId("fragPopupDialog--i_VACATION_DAYS").getValue();
			oEntry.VacationBonusDays = sap.ui.getCore().byId("fragPopupDialog--i_VACATION_BONUS_DAYS").getValue();
			oEntry.FloaterDays = sap.ui.getCore().byId("fragPopupDialog--i_FLOATER_DAYS").getValue();
			oEntry.Description = sap.ui.getCore().byId("fragPopupDialog--i_DESCRIPTION").getValue();
			oEntry.GrantedDays = sap.ui.getCore().byId("fragPopupDialog--i_GRANTED_DAYS").getValue();
			//VALIDATIONS
			if (oEntry.InspId.trim().length == 0) {
				sap.ui.getCore().getControl("fragPopupDialog--i_INSP_ID").setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().getControl("fragPopupDialog--i_INSP_ID").setValueStateText("Please Enter Inspector ID");
				sap.m.MessageToast.show("Please enter some value for Inspector ID...");
				return;
			}
			//Get Model
			var oModel = this.getOwnerComponent().getModel();
			oModel.create("/ZCFG_INSPECTORSet", oEntry, {
				success: function(oData, oResponse) {
					sap.m.MessageToast.show("Record Created");
					oModel.updateBindings();
				},
				error: function(oError) {
					////sap.m.MessageToast.show("Failed to create Record");
					//alert("Failed to create Record");
					//var sCompleteMessage = oResponse.headers["sap-message"];
					//var oMessage = JSON.parse(sCompleteMessage);
					//alert(oError);
					sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
					//var oResponseBody = JSON.parse(oError.response.body);
					//sap.m.MessageToast.show(oResponseBody.err);
					//oModel.updateBindings();
					//return;
					oModel.refresh();
				}
			});
			this.closeDialog();
		},

		/**
		 * Handle Inspector Delete Event
		 * Popupp Confirmation
		 * @public
		 */
		onDeletePress: function(oEvent) {
			//This code was generated by the layout editor.
			var oSelectedItem = oEvent.getParameter("listItem");
			var sItemName = oSelectedItem.getBindingContext().getProperty("InspId");

			gDeleteInspId = sItemName;
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

				oModel.remove("/ZCFG_INSPECTORSet('" + gDeleteInspId + "')", {
					success: function(oData, oResponse) {
						//that.onNavBack();
						gDeleteInspId = '';
						sap.m.MessageToast.show("Record Deleted...");
						//oModel.refresh();
						oModel.updateBindings();

					},
					error: function(oError) {
						gDeleteInspId = '';
						sap.m.MessageToast.show("Record Not Deleted. Please check with Admin.");
						//sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
						oModel.refresh();
					}
				});
			}
		},

		/**
		 * On Table Selection Change; Not needed at this stage
		 */
		onSelectionChange: function(oEvent) {

		},

		/**
		 * Handle Save All Button Event
		 * Check which records have been changed, and update the Model in batch
		 * @public
		 */
		onSaveAll: function() {

			var oTable = this.byId("inspTable");
			var oModel = this.getOwnerComponent().getModel();
			//oModel.setDeferredGroups(["updateRecs"]);

			var oTable = that.getView().byId("inspTable");
			var a = 0;

			//Loop through entire table, and add changed records in 
			oTable.getItems().forEach(function(row) {
				var oEntry = {};
				var obj = row.getBindingContext().getObject();
				if (this.gChangedInspsArr.indexOf(obj.InspId) > -1) { //If record was changed
					//if (obj.InspId ) {

					var cells = row.getCells();
					//console.log(cells);
					//console.log(cells[3].getAccessibilityInfo());
					//console.log(cells[3].getMetadata());

					oEntry.InspId = cells[0].getTitle();
					oEntry.WrmCountExclude = cells[2].getSelected();
					oEntry.WrmAvailDaysOvr = cells[3].getValue();
					oEntry.VacationDays = cells[4].getValue();
					oEntry.VacationBonusDays = cells[5].getValue();
					oEntry.GrantedDays = cells[6].getValue();
					oEntry.FloaterDays = cells[7].getValue();
					oEntry.Description = cells[8].getValue();
					////alert("INSP: " + oEntry.InspId);
					//console.log(oEntry);
					oModel.update("/ZCFG_INSPECTORSet('" + oEntry.InspId + "')", oEntry, {
						groupId: "updateRecsGrpId",
						changeSetId: "InspChangeID"
					});
				}
			});

			oModel.submitChanges({
				groupId: "updateRecsGrpId",

				success: function(oData, oResponse) {
					//	that.onNavBack();
					this.gChangedInspsArr = [];
					//oModel.refresh();
					sap.m.MessageToast.show("Records Updated");
				},
				error: function(oError) {
					//sap.m.MessageToast.show(sap.ui.getCore().getMessageManager().getMessageModel().oData[0].message);
					sap.m.MessageToast.show("Record Not Updated. Please check with Admin.");
					//	oModel.refresh();

					//return;
				}
			});
		},
		/**
		 *@ Value changed for a field. add Inspector ID to array, so we can update all together in SaveAll method.
		 */
		onFieldValueChange: function(oControlEvent) {

			//This code was generated by the layout editor.
			var oSelectedItem = oControlEvent.getSource();

			var obj = oControlEvent.getSource().getBindingContext().getObject();
			///console.log(oControlEvent.getSource().getBindingContext().getPath()); //gets the current index of your table row                

			//Add Change Inspector to Array
			this.gChangedInspsArr.push(obj.InspId);

		},

		/**
		 *@ Clear Duplicates from Array; Not used yet
		 */
		squash: function(arr) {
			var tmp = [];
			for (var i = 0; i < arr.length; i++) {
				if (tmp.indexOf(arr[i]) == -1) {
					tmp.push(arr[i]);
				}
			}
			return tmp;
		},

		/**
		 * Handle Search Event. 
		 */
		onSearchPressed: function() {

			var newFilters = [];
			var searchString = this.byId("searchField").getValue();
			var oTable = this.byId("inspTable");
			var binding = oTable.getBinding("items");

			//Add Search String to Filter parameter
			var filter = new sap.ui.model.Filter("InspId", sap.ui.model.FilterOperator.EQ, searchString);
			newFilters.push(filter);

			//Attach Filters to request
			binding.filter(newFilters);
			binding.applyFilter(newFilters);
		},

		/**
		 * Handle Inpsector Search Value Help in Add Dialog box
		 */
		handleInspValueHelp: function(oEvent) {

			var sInputValue = oEvent.getSource().getValue();
			//this.inputId = oEvent.getSource().getId();

			// create value help dialog
			if (!this._valueHelpDialog) {
				//	alert("2");
				this._valueHelpDialog = sap.ui.xmlfragment("fragVhInsp",
					"Z_MANG_INSP_DT.view.InspValueHelpDialog",
					this
				);
				//alert("2a");
				this.getView().addDependent(this._valueHelpDialog);
			}

			this._valueHelpDialog.open(sInputValue);
		},

		/**
		 * Handle Inpsector Search Value Help Dialog box close event
		 */
		handleInspValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");

			if (oSelectedItem) {
				sap.ui.getCore().byId("fragPopupDialog--i_INSP_ID").setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},

		/**
		 * Handle Inpsector Search Value Help Dialog box Search Query
		 */
		handleInspValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			//alert(sValue);
			var oFilter = new sap.ui.model.Filter(
				"LastnameFirstname",
				sap.ui.model.FilterOperator.EQ, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		/**
		 * Handle Inpsector Search Value Help Dialog box close event
		 */
		/*
		onTableExport: function(oEvent) {
			jQuery.sap.require("sap.ui.core.util.Export");
			jQuery.sap.require("sap.ui.core.util.ExportTypeCSV");
			//			var oTable = oEvent.getSource().getParent().getParent();

			//var oTable = this.byId("inspTable");
			var oTable = sap.ui.table;
			oTable = that.getView().byId("inspTable");

			oTable.exportData({
				exportType: new sap.ui.core.util.ExportTypeCSV({
					separatorChar: ";"
				})
			}).saveFile().always(function() {
				this.destroy();
			});
		},
		*/

		/*********************************************************************************************/
		/**
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
					path: "/ZCFG_INSPECTORSet"
				},

				// column definitions with column name and binding info for the content

				columns: [{
						name: "ID",
						template: {
							content: "{InspId}"
						}
					}, {
						name: "Name",
						template: {
							content: "{Name}"
						}
					}, {
						name: "Excl From Count",
						template: {
							content: "{WrmCountExclude}"
						}
					}, {
						name: "Availability Days",
						template: {
							content: "{WrmAvailDaysOvr}"
						}
					},

					{
						name: "Vacation Days",
						template: {
							content: "{VacationDays}"
						}
					},

					{
						name: "Vac. Bonus Days",
						template: {
							content: "{VacationBonusDays}"
						}
					},

					{
						name: "Granted Days",
						template: {
							content: "{GrantedDays}"
						}
					},

					{
						name: "Description",
						template: {
							content: "{Description}"
						}
					}
				]
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