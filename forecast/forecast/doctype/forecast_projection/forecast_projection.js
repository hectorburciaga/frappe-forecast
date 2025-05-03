// Copyright (c) 2025, Hector Burciaga and contributors
// For license information, please see license.txt

frappe.ui.form.on('Forecast Projection', {
    refresh: function (frm, cdt, cdn) {
        frm.add_custom_button(__("Sales Order"), function () {
            show_sord_dialog(frm);
        }, __("Get Items From"));
        frm.add_custom_button(__("Purchase Order"), function () {
            show_pord_dialog(frm);
        }, __("Get Items From"));
        update_totals(frm, cdt, cdn);
        update_net_total(frm);
    },

    company(frm) {
        frm.set_query("project", (doc) => {
            return {
                filters: {
                    "company": doc.company,
                    "status": "Open",
                }
            };
        });
    }
});

frappe.ui.form.on('Forecast Item', {
    item_code: function (frm, cdt, cdn) {
        var child = locals[cdt][cdn];
        var qty = child.qty;
        var rate = child.rate;
        var amount = qty * rate;

        if (!child.amount) {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        update_totals(frm, cdt, cdn);
        update_net_total(frm);
    },

    qty: function (frm, cdt, cdn) {
        var child = locals[cdt][cdn];
        var qty = child.qty;
        var rate = child.rate;
        var amount = qty * rate;

        if (!child.amount) {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        else {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        update_totals(frm, cdt, cdn);
        update_net_total(frm);
    }
});

function show_sord_dialog(frm) {
    new frappe.ui.form.MultiSelectDialog(
        {
            doctype: "Sales Order",
            target: cur_frm,
            setters: {
                customer: null,
                company: frm.doc.company,
                project: frm.doc.project,
                net_total: null,
                per_billed: ["<=", "99.99999"],
            },
            add_filters_group: 1,
            date_field: "transaction_date",
            get_query() {
                return {
                    filters: {
                        "company": frm.doc.company,
                        "project": frm.doc.project,
                    }
                }
            },
            action(selections) {
                get_sord(selections);
                cur_dialog.hide();
            }
        });
}

function get_sord(selections) {
    var sales_orders = selections;

    sales_orders.forEach((sales_order) => {
        () => sales_order;
        get_items_from_sord(sales_order);
    });
}

function get_items_from_sord(sales_order) {
    frappe.call({
        "method": "frappe.client.get",
        args: {
            doctype: "Sales Order",
            name: sales_order,
        },
        callback: (r) => {
            var sinv = r.message;
            sinv.items.forEach(function (item) {
                var child = cur_frm.add_child('forecast_items');
                frappe.model.set_value(child.doctype, child.name, 'item_code', item.item_code);
                frappe.model.set_value(child.doctype, child.name, 'item_name', item.item_name);
                frappe.model.set_value(child.doctype, child.name, 'description', item.description);
                frappe.model.set_value(child.doctype, child.name, 'qty', item.qty);
                frappe.model.set_value(child.doctype, child.name, 'uom', item.uom);
                frappe.model.set_value(child.doctype, child.name, 'rate', item.rate);
                frappe.model.set_value(child.doctype, child.name, 'sales_order', item.parent);
            });
            cur_frm.refresh_field('forecast_items');
            cur_frm.set_value('customer', sinv.customer);
            cur_frm.set_value('sales_order', sinv.name);
        }
    });

}

function update_totals(frm, cdt, cdn) {
    var child = locals[cdt][cdn];
    var total = 0;
    frm.doc.forecast_items.forEach(function (child) { total += child.amount; });
    frm.set_value("in_subtotal", total);
    refresh_field("in_subtotal");
}

frappe.ui.form.on('Contractor Item', {
    item_code: function (frm, cdt, cdn) {
        var child = locals[cdt][cdn];
        var qty = child.qty;
        var rate = child.rate;
        var amount = qty * rate;

        if (!child.amount) {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        update_po_totals(frm, cdt, cdn);
        update_net_total(frm);
    },

    qty: function (frm, cdt, cdn) {
        var child = locals[cdt][cdn];
        var qty = child.qty;
        var rate = child.rate;
        var amount = qty * rate;

        if (!child.amount) {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        else {
            child.amount = amount;
            refresh_field("amount", cdn);
        }

        update_po_totals(frm, cdt, cdn);
        update_net_total(frm);
    }
});

function show_pord_dialog(frm) {
    new frappe.ui.form.MultiSelectDialog(
        {
            doctype: "Purchase Order",
            target: cur_frm,
            setters: {
                supplier: null,
                company: frm.doc.company,
                project: frm.doc.project,
                net_total: null,
                per_billed: ["<=", "99.99999"],
            },
            add_filters_group: 1,
            date_field: "transaction_date",
            get_query() {
                return {
                    filters: {
                        "company": frm.doc.company,
                        "project": frm.doc.project,
                    }
                }
            },
            action(selections) {
                get_pord(selections);
                cur_dialog.hide();
            }
        });
}

function get_pord(selections) {
    var purchase_orders = selections;

    purchase_orders.forEach((purchase_order) => {
        () => purchase_order;
        get_items_from_pord(purchase_order);
    });
}

function get_items_from_pord(purchase_order) {
    frappe.call({
        "method": "frappe.client.get",
        args: {
            doctype: "Purchase Order",
            name: purchase_order,
        },
        callback: (r) => {
            var pord = r.message;
            pord.items.forEach(function (item) {
                var child = cur_frm.add_child('subcontracts');
                frappe.model.set_value(child.doctype, child.name, 'item_code', item.item_code);
                frappe.model.set_value(child.doctype, child.name, 'item_name', item.item_name);
                frappe.model.set_value(child.doctype, child.name, 'description', item.description);
                frappe.model.set_value(child.doctype, child.name, 'qty', item.qty);
                frappe.model.set_value(child.doctype, child.name, 'uom', item.uom);
                frappe.model.set_value(child.doctype, child.name, 'rate', item.rate);
                frappe.model.set_value(child.doctype, child.name, 'purchase_order', item.parent);
            });
            cur_frm.refresh_field('subcontracts');
            cur_frm.set_value('purchase_order', pord.name);
        }
    });

}

function update_po_totals(frm, cdt, cdn) {
    var child = locals[cdt][cdn];
    var total = 0;
    frm.doc.subcontracts.forEach(function(child) { total += child.amount; });
    frm.set_value("out_subtotal", total);
    refresh_field("out_subtotal");
}

function update_net_total(frm) {
    var total = frm.doc.in_subtotal - frm.doc.out_subtotal;
    frm.set_value("net_total", total);
    refresh_field("net_total");
}

function update_net_total(frm) {
    var total = frm.doc.in_subtotal - frm.doc.out_subtotal;
    frm.set_value("net_total", total);
    refresh_field("net_total");
}