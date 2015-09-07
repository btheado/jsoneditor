/*\
title: $:/plugins/btheado/jsoneditor/jsoneditor-widget.js
type: application/javascript
module-type: widget

JSON Editor widget

\*/

(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Too lazy to write my own isEquals or find another way, so use one from lodash
var _ = require("$:/plugins/btheado/jsoneditor/lodash");

// Pull in the meat of the functionality
require("$:/plugins/btheado/jsoneditor/jsoneditor.js");

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var JSONEditorWidget = function(parseTreeNode,options) {
  this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
JSONEditorWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
JSONEditorWidget.prototype.render = function(parent,nextSibling) {
  var options = this.getOptionsFromAttributes();
  this.domNode = this.document.createElement("div");
  this.editor = new JSONEditor(this.domNode, options);
  // Workaround for what I think is a bug in jsoneditor
  if (_.isEmpty(options.schema) && (options.startval == 0)) this.editor.setValue(options.startval);
  this.cb = this.addSaveJsonCallback.bind(this);
  var self=this; this.editor.on("change", this.cb); //Always ignore first call to change callback
  parent.insertBefore(this.domNode,nextSibling);
  this.domNodes.push(this.domNode);
  this.options = options; // To detect need for re-render
	this.parentDomNode = parent; // For refreshSelf()
}
JSONEditorWidget.prototype.saveJson = function() {
  var jsonOutput = this.getAttribute("jsonOutput", "!!json-output");
  var json = JSON.parse(this.wiki.getTextReference(jsonOutput, "{}", this.getVariable("currentTiddler")));
  var editorValue = this.editor.getValue();
  if (!_.isEqual(json, editorValue)) {
    this.wiki.setTextReference(jsonOutput, JSON.stringify(this.editor.getValue()), this.getVariable("currentTiddler"));
  }
}
JSONEditorWidget.prototype.addSaveJsonCallback = function() {
  var self=this;
  this.editor.off("change", this.cb);
  this.editor.on("change", function() {self.saveJson();}); // autosave changes
}
JSONEditorWidget.prototype.getTextContent = function() {
  var dom = document.createElement("div");
  this.makeChildWidgets();
  this.renderChildren(dom);
  return dom.textContent;
}
JSONEditorWidget.prototype.getOptionsFromAttributes = function() {
  this.computeAttributes();
  var options = {};

  // An attribute named 'schema' contains TextReference from which to retreive
  // the json schema definition. Defaults to '{}' since JSONEditor still works
  // with that degenerate case. Would be nice to allow putting the schema as
  // plaintext body of the widget, but I'm not sure how to get the unparsed
  // child text body.
  var schema = this.getAttribute("schema");
  if (schema) {
    options.schema = JSON.parse(this.wiki.getTextReference(schema, "{}", this.getVariable("currentTiddler")));
  } else {
    var schemaText = this.getTextContent();
    console.log(schemaText);
    if (schemaText != "") {
      options.schema = JSON.parse(schemaText);
    } else {
      options.schema = {};
    }
  }

  // The TextReference in the jsonOutput attribute indicates where to store the
  // serialized json string represented by the JSONEditor. Preload the JSONEditor
  // form with this json if it already exists
  var jsonOutput = this.getAttribute("jsonOutput", "!!json-output");
  var jsons = this.wiki.getTextReference(jsonOutput, null, this.getVariable("currentTiddler"));
  if(jsons) {
    options.startval = JSON.parse(jsons);
  }
  return options;
}
JSONEditorWidget.prototype.refresh = function(changedTiddlers) {
  var options = this.getOptionsFromAttributes();
  if (!_.isEqual(this.options, options)) {
    var self=this; this.editor.off("change");
    this.refreshSelf();
    return true;
  } else {
    return false;
  }
};

exports.jsoneditor = JSONEditorWidget;

})();

