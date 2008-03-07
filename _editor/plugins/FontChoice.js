dojo.provide("dijit._editor.plugins.FontChoice");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dojo.i18n");

dojo.requireLocalization("dijit._editor", "FontChoice");

dojo.declare("dijit._editor.plugins.FontChoice",
	dijit._editor._Plugin,
	{
		//	summary:
		//		This plugin provides three dropdowns for setting font information in the editor
		//
		//	description:
		//		The commands provided by this plugin are:
		//		* fontName
		//	|		Provides a dropdown to select from a list of generic font names
		//		* fontSize
		//	|		Provides a dropdown to select from a list of pre-defined font sizes
		//		* formatBlock
		//	|		Provides a dropdown to select from a list of styles
		//  |
		//		custom additions to this list are possible by specifying a list on djConfig[x]
		//		where x is one of the plugins above.

		_uniqueId: 0,

		buttonClass: dijit.form.FilteringSelect,

		_initButton: function(){
			//TODO: would be nice to be able to handle comma-separated font lists and search within them
			var cmd = this.command;
			var names = {
				fontName: ["serif", "sans-serif", "monospace", "cursive", "fantasy"], // CSS font-family generics
				fontSize: [1,2,3,4,5,6,7], // sizes according to the old HTML FONT SIZE
				formatBlock: ["p", "h1", "h2", "h3", "pre"] }[cmd];
			var additions = dojo.config[cmd];
			if(additions){
				names = names.concat(additions);
			}
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			var items = dojo.map(names, function(value){
				var name = strings[value] || value;
				var label = name;
				switch(cmd){
				case "fontName":
					label = "<div style='font-family: "+value+"'>" + name + "</div>";
					break;
				case "fontSize":
					// we're stuck using the deprecated FONT tag to correspond with the size measurements used by the editor
					label = "<font size="+value+"'>"+name+"</font>";
					break;
				case "formatBlock":
					label = "<" + value + ">" + name + "</" + value + ">";
				}
				return { label: label, name: name, value: value };
			});
			items.push({label: "", name:"", value:""}); // FilteringSelect doesn't like unmatched blank strings

			dijit._editor.plugins.FontChoice.superclass._initButton.apply(this,
				[{ labelType: "html", labelAttr: "label", searchAttr: "name", store: new dojo.data.ItemFileReadStore(
					{ data: { identifier: "value", items: items } })}]);

			this.button.setValue("");

			this.connect(this.button, "onChange", function(choice){
				if(this.updating){ return; }
				// FIXME: IE is really messed up here!!
				if(dojo.isIE){
					if("_savedSelection" in this){
						var b = this._savedSelection;
						delete this._savedSelection;
						this.editor.focus();
						this.editor._moveToBookmark(b);
					}
				}else{
//					this.editor.focus();
					dijit.focus(this._focusHandle);
				}
				this.editor.execCommand(this.command, choice);
			});
		},

		updateState: function(){
			this.inherited(arguments);
			var _e = this.editor;
			var _c = this.command;
			if(!_e || !_e.isLoaded || !_c.length){ return; }
			if(this.button){
				var value = _e.queryCommandValue(_c);
//console.log("cmd="+this.command+" value="+value);
				this.updating = true;
				this.button.setValue(value);
				delete this.updating;
			}

			// FIXME: IE is *really* b0rken
			if(dojo.isIE){
				this._savedSelection = this.editor._getBookmark();
			}
			this._focusHandle = dijit.getFocus(this.editor.iframe);
		},

		setToolbar: function(){
			this.inherited(arguments);

			var forRef = this.button;
			if(!forRef.id){ forRef.id = "dijitEditorButton-"+this.command+(this._uniqueId++); } //TODO: is this necessary?  FilteringSelects always seem to have an id?
			var label = dojo.doc.createElement("label");
			dojo.addClass(label, "dijit dijitReset dijitLeft dijitInline");
			label.setAttribute("for", forRef.id);
			var strings = dojo.i18n.getLocalization("dijit._editor", "FontChoice");
			label.appendChild(dojo.doc.createTextNode(strings[this.command]));
			dojo.place(label, this.button.domNode, "before");
		}
	}
);

dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "fontName": case "fontSize": case "formatBlock":
		o.plugin = new dijit._editor.plugins.FontChoice({command: o.args.name});
	}
});
