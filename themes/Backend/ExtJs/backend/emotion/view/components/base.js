/**
 * Shopware 5
 * Copyright (c) shopware AG
 *
 * According to our dual licensing model, this program can be used either
 * under the terms of the GNU Affero General Public License, version 3,
 * or under a proprietary license.
 *
 * The texts of the GNU Affero General Public License with an additional
 * permission and of our proprietary license can be found at and
 * in the LICENSE file you have received along with this program.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * "Shopware" is a registered trademark of shopware AG.
 * The licensing of the program under the AGPLv3 does not imply a
 * trademark license. Therefore any rights, title and interest in
 * our trademarks remain entirely with us.
 *
 * @category   Shopware
 * @package    UserManager
 * @subpackage View
 * @version    $Id$
 * @author shopware AG
 */

//{namespace name=backend/emotion/view/detail}
Ext.define('Shopware.apps.Emotion.view.components.Base', {
    extend: 'Ext.form.Panel',
    bodyBorder: 0,
    layout: 'anchor',
    cls: 'shopware-form',
    autoScroll: true,
    modal: true,
    margin: 4,
    border: 0,
    bodyPadding: 26,
    alias: 'widget.emotion-components-base',
    defaults: {
        anchor: '100%'
    },
    initComponent: function() {
        var me = this;

        // If we're having items already, don't override them
        if(!me.items) {
            me.items = [];
        }

        // Holder fieldset which contains the element settings
        me.elementFieldset = Ext.create('Ext.form.FieldSet', {
            title: '{s name=base/fieldset_title}Element settings{/s}',
            defaults: me.defaults,
            items: me.createFormElements()
        });

        // Holder fieldset which contains the global element settings
        me.globalSettingsFieldset = Ext.create('Ext.form.FieldSet', {
            title: '{s name=base/global_fieldset_title}Global element settings{/s}',
            defaults: me.defaults,
            items: me.createGlobalFormElements()
        });

        if(me.getSettings('component', true).description.length) {
            me.items.push(me.createDescriptionContainer());
        }
        me.items.push(me.elementFieldset);
        me.items.push(me.globalSettingsFieldset);
        me.callParent(arguments);
        me.loadElementData(me.getSettings('record').get('data'));
    },

    loadElementData: function(data) {
        var me = this, fields = [];
        Ext.each(data, function(item) {
            var field = me.down('field[name='+ item.key +']');
            if (field !== null) {
                try {
                    field.setValue(item.value);
                } catch(e) { }
            }
        });
    },

    createFormElements: function() {
        var me = this, items = [], store, name, fieldLabel, snippet, supportText, sortedFields, boxLabel = '';

        sortedFields = Ext.Array.sort(
            me.getSettings('fields', true),
            function(item1, item2) { return item1.get('position') - item2.get('position')}
        );

        Ext.each(sortedFields, function(item) {
            name = item.get('name');
            fieldLabel = item.get('fieldLabel');
            supportText = item.get('supportText');

            if (me.snippets && me.snippets[name]) {
                snippet = me.snippets[name];

                if (Ext.isObject(snippet)) {
                    if (snippet.hasOwnProperty('supportText')) supportText = snippet.supportText;
                    if (snippet.hasOwnProperty('fieldLabel')) fieldLabel = snippet.fieldLabel;
                } else {
                    fieldLabel = snippet;
                }
            }

            store = null;
            if (item.get('store')) {
                store = Ext.create(item.get('store'));
            }

            if (item.get('xType') === 'checkbox' || item.get('xType') === 'checkboxfield') {
                boxLabel = supportText;
                supportText = '';
            }

            items.push({
                xtype: item.get('xType'),
                helpText: item.get('helpText') || '',
                fieldLabel: fieldLabel || '',
                fieldId: item.get('id'),
                valueType: item.get('valueType'),
                queryMode: 'remote',
                name: item.get('name') || '',
                store: store,
                displayField: item.get('displayField'),
                valueField: item.get('valueField'),
                checkedValue: true,
                uncheckedValue: false,
                supportText: supportText || '',
                allowBlank: (item.get('allowBlank') ? true : false),
                value: item.get('defaultValue') || '',
                labelWidth: 100,
                boxLabel: boxLabel
            });
        });

        return items;
    },

    /**
     * Contains the global settings form elements.
     *
     * @private
     * @return [object] Ext.form.field.Text
     */
    createGlobalFormElements: function() {
        var me = this, record = me.getSettings('record');

        me.cssClassField = Ext.create('Ext.form.field.Text', {
            fieldLabel: '{s name=base/css_class}CSS class{/s}',
            supportText: '{s name=base/support_text}Multiple classes can be added by separating them with a whitespace.{/s}',
            name: 'name',
            cls: 'css-field',
            anchor: '100%',
            allowBlank: true,
            labelWidth: 100,
            value: record.get('cssClass'),
            validator: function(value) {
                if (!value) {
                    return true;
                }

                if(!value.match(/^[A-Za-z0-9-_ ]+$/)) {
                    return '{s name=base/validator_special_character_error}The input value can not contain any special characters.{/s}';
                }

                if(value.match(/\s([-_ 0-9])/)) {
                    return '{s name=base/validator_first_character_error}Class names can not start with a number, whitespace, underscore or hyphen.{/s}';
                }

                if(value.match(/^[-_ 0-9]/)) {
                    return '{s name=base/validator_first_character_error}Class names can not start with a number, whitespace, underscore or hyphen.{/s}';
                }

                return true;
            }
        });

        return me.cssClassField;
    },

    /**
     * Creates a fieldset with the element description.
     *
     * @private
     * @return [object] Ext.form.FieldSet
     */
    createDescriptionContainer: function() {
        var me = this, component = me.getSettings('component', true);

        return Ext.create('Ext.form.FieldSet', {
            title: '{s name=base/element_description}Element description{/s}',
            items: [{
                xtype: 'container',
                html: component.description
            }]
        });
    },

    /**
     * Helper method which returns the settings or if
     * the type parameter is set, the part of the settings
     * object.
     *
     * @public
     * @param [string] type - Type of the settings (fields, component, grid)
     * @param [boolean] data - Should the method return the data object
     * @return [object|boolean] settings or false
     */
    getSettings: function(type, data) {
        if(type) {
            var settings = this.settings[type];
            if(data) {
                return (!settings) ? false : (this.settings[type].data.items) ? this.settings[type].data.items : this.settings[type].data;
            }
            return this.settings[type];
        }
        return this.settings;
    }
});