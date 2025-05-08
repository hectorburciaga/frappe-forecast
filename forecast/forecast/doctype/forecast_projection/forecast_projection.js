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
/*         update_in_totals(frm, cdt, cdn);
        update_po_totals(frm, cdt, cdn);
        update_net_total(frm); */
    },
    before_save: function (frm, cdt, cdn) {
        update_in_totals(frm, cdt, cdn);
        update_po_totals(frm, cdt, cdn);
        update_net_total(frm);
    },
    after_save: function (frm, cdt, cdn) {
        update_deduction_number(frm);
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
    },

    subcontracts: function (frm, cdt, cdn) {
        update_po_totals(frm, cdt, cdn);
    },

    in_deduct(frm) {
        in_deduct_dialog(frm);
    },

    out_deduct(frm) {
        out_deduct_dialog(frm);
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

        update_in_totals(frm, cdt, cdn);
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

        update_in_totals(frm, cdt, cdn);
        update_net_total(frm);
    },

    forecast_items_add(frm, cdt, cdn) {
        update_in_totals(frm, cdt, cdn);
        update_net_total(frm);
    },

    forecast_items_remove(frm, cdt, cdn) {
        frappe.msgprint("Sales Order Removed");
        update_in_totals(frm, cdt, cdn);
        update_net_total(frm);
    }

});

frappe.ui.form.on('Forecast Deduction', {
    in_deductions_add(frm, cdt, cdn) {
        update_in_deduct_totals(frm, cdt, cdn);
        update_net_total(frm);
    },
    in_deductions_remove(frm, cdt, cdn) {
        frappe.msgprint("Income Deduction Removed");
        update_in_deduct_totals(frm, cdt, cdn);
        update_net_total(frm);
    },
    out_deductions_add(frm, cdt, cdn) {
        update_out_deduct_totals(frm, cdt, cdn);
        update_net_total(frm);
    },
    out_deductions_remove(frm, cdt, cdn) {
        frappe.msgprint("Income Deduction Removed");
        update_out_deduct_totals(frm, cdt, cdn);
        update_net_total(frm);
    }
});

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
    },

    subcontracts_remove(frm, cdt, cdn) {
        frappe.msgprint("Purchase Order Removed");
        update_po_totals(frm, cdt, cdn);
        update_net_total(frm);
    }
});

// Sales Order Dialog
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
                per_billed: null,
            },
            add_filters_group: 1,
            date_field: "transaction_date",
            columns: ["name", "customer", "transaction_date", "project", "net_total", "per_billed", "status"],
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
        },

    });

}

function update_in_totals(frm, cdt, cdn) {
    var child = locals[cdt][cdn];
    var total = 0;
    frm.doc.forecast_items.forEach(function (child) { total += child.amount; });
    frm.set_value("in_subtotal", total);
    refresh_field("in_subtotal");
    in_net_total(frm);
}

//Purchase Order Dialog
function show_pord_dialog(frm) {
    new frappe.ui.form.MultiSelectDialog(
        {
            doctype: "Purchase Order",
            target: cur_frm,
            setters: {
                supplier: null,
                company: frm.doc.company,
                project: frm.doc.project,
                status: null,
                net_total: null,
                per_billed: ["<=", "99.99999"],
            },
            add_filters_group: 1,
            date_field: "transaction_date",
            columns: ["name", "supplier", "transaction_date", "project", "net_total", "per_billed", "status"],
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
    frm.doc.subcontracts.forEach(function (child) { total += child.amount; });
    frm.set_value("out_subtotal", total);
    refresh_field("out_subtotal");
    out_net_total(frm);
}

//Income Deduction Dialog
function in_deduct_dialog(frm, cdt, cdn) {

    var base = frm.doc.in_subtotal;
    let d = new frappe.ui.Dialog({
        title: 'Income Deductions',
        fields: [
            {
                label: 'Deduction Type',
                fieldname: 'deduction_type',
                fieldtype: 'Link',
                options: 'Forecast Deduction Type',
                reqd: 1,
                onchange: function () {
                    var subtotal = base;
                    d.set_value('deduction_base', subtotal);
                }
            },
            {
                label: 'Calculation Type',
                fieldname: 'calc_type',
                fieldtype: 'Select',
                options: ['Percentage', 'Fixed Amount'],
                reqd: 1,
            },
            {
                label: 'Deduction Base',
                fieldname: 'deduction_base',
                fieldtype: 'Currency',
                reqd: 1,
                read_only: true,
            },
            {
                label: 'Deduction (% or Amount)',
                fieldname: 'deduction_amount',
                fieldtype: 'Float',
                reqd: 1,
                onchange: function () {
                    var amount = d.get_value('deduction_amount');
                    var type = d.get_value('calc_type');
                    if (type == 'Fixed Amount') {
                        var subtotal = base;
                        var percent = (amount / subtotal) * 100;
                        d.set_value('per_deduction', percent);
                        d.set_value('total_deduction', amount);
                    }
                    else if (type == 'Percentage') {
                        var subtotal = base;
                        var percent = amount;
                        var total = (percent / 100) * subtotal;
                        d.set_value('total_deduction', total);
                        d.set_value('per_deduction', percent);
                    }
                }
            },
            {
                label: 'Percentage',
                fieldname: 'per_deduction',
                fieldtype: 'Percent',
                reqd: 1,
                read_only: true,
            },
            {
                label: 'Total Deduction',
                fieldname: 'total_deduction',
                fieldtype: 'Currency',
                reqd: 1,
                read_only: true,
            }
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Submit',
        primary_action(values) {
            get_in_deduct(values);
            update_in_deduct_totals(frm, cdt, cdn);
            update_net_total(frm);
            d.hide();
        }
    });
    d.show();
}

function get_in_deduct(values) {
    var child = cur_frm.add_child('in_deductions');
    frappe.model.set_value(child.doctype, child.name, 'deduction_type', values.deduction_type);
    frappe.model.set_value(child.doctype, child.name, 'calc_type', values.calc_type);
    frappe.model.set_value(child.doctype, child.name, 'deduction_base', values.deduction_base);
    frappe.model.set_value(child.doctype, child.name, 'per_deduction', values.per_deduction);
    frappe.model.set_value(child.doctype, child.name, 'total_deduction', values.total_deduction);
    //frappe.model.set_value(child.doctype, child.name, 'forecast_projection', cur_frm.doc.name);
    frappe.model.set_value(child.doctype, child.name, 'applies_to', "Income");
    cur_frm.refresh_field('in_deductions');
}

function update_in_deduct_totals(frm, cdt, cdn) {
    var child = locals[cdt][cdn];
    var total = 0;
    frm.doc.in_deductions.forEach(function (child) { total += child.total_deduction; });
    frm.set_value("total_in_deductions", total);
    refresh_field("total_in_deductions");
    in_net_total(frm);
}

function in_net_total(frm) {
    var total = frm.doc.in_subtotal - frm.doc.total_in_deductions;
    frm.set_value("in_net_total", total);
    refresh_field("in_net_total");
}

//Expense Deduction Dialog
function out_deduct_dialog(frm, cdt, cdn) {

    var base = frm.doc.out_subtotal;
    let d = new frappe.ui.Dialog({
        title: 'Expense Deductions',
        fields: [
            {
                label: 'Deduction Type',
                fieldname: 'deduction_type',
                fieldtype: 'Link',
                options: 'Forecast Deduction Type',
                reqd: 1,
                onchange: function () {
                    var subtotal = base;
                    d.set_value('deduction_base', subtotal);
                }
            },
            {
                label: 'Calculation Type',
                fieldname: 'calc_type',
                fieldtype: 'Select',
                options: ['Percentage', 'Fixed Amount'],
                reqd: 1,
            },
            {
                label: 'Deduction Base',
                fieldname: 'deduction_base',
                fieldtype: 'Currency',
                reqd: 1,
                read_only: true,
            },
            {
                label: 'Deduction (% or Amount)',
                fieldname: 'deduction_amount',
                fieldtype: 'Float',
                reqd: 1,
                onchange: function () {
                    var amount = d.get_value('deduction_amount');
                    var type = d.get_value('calc_type');
                    if (type == 'Fixed Amount') {
                        var subtotal = base;
                        var percent = (amount / subtotal) * 100;
                        d.set_value('per_deduction', percent);
                        d.set_value('total_deduction', amount);
                    }
                    else if (type == 'Percentage') {
                        var subtotal = base;
                        var percent = amount;
                        var total = (percent / 100) * subtotal;
                        d.set_value('total_deduction', total);
                        d.set_value('per_deduction', percent);
                    }
                }
            },
            {
                label: 'Percentage',
                fieldname: 'per_deduction',
                fieldtype: 'Percent',
                reqd: 1,
                read_only: true,
            },
            {
                label: 'Total Deduction',
                fieldname: 'total_deduction',
                fieldtype: 'Currency',
                reqd: 1,
                read_only: true,
            }
        ],
        size: 'small', // small, large, extra-large 
        primary_action_label: 'Submit',
        primary_action(values) {
            get_out_deduct(values);
            update_out_deduct_totals(frm, cdt, cdn);
            update_net_total(frm);
            d.hide();
        }
    });
    d.show();
}

function get_out_deduct(values) {
    var child = cur_frm.add_child('out_deductions');
    frappe.model.set_value(child.doctype, child.name, 'deduction_type', values.deduction_type);
    frappe.model.set_value(child.doctype, child.name, 'calc_type', values.calc_type);
    frappe.model.set_value(child.doctype, child.name, 'deduction_base', values.deduction_base);
    frappe.model.set_value(child.doctype, child.name, 'per_deduction', values.per_deduction);
    frappe.model.set_value(child.doctype, child.name, 'total_deduction', values.total_deduction);
    //frappe.model.set_value(child.doctype, child.name, 'forecast_projection', cur_frm.doc.name);
    frappe.model.set_value(child.doctype, child.name, 'applies_to', "Expense");
    cur_frm.refresh_field('out_deductions');
}

function update_out_deduct_totals(frm, cdt, cdn) {
    var child = locals[cdt][cdn];
    var total = 0;
    frm.doc.out_deductions.forEach(function (child) { total += child.total_deduction; });
    frm.set_value("total_out_deductions", total);
    refresh_field("total_out_deductions");
    out_net_total(frm);
}

function out_net_total(frm) {
    var total = frm.doc.out_subtotal - frm.doc.total_out_deductions;
    frm.set_value("out_net_total", total);
    refresh_field("out_net_total");
}

//Updates Net Total
function update_net_total(frm) {
    var total = frm.doc.in_net_total - frm.doc.out_net_total;
    frm.set_value("net_total", total);
    refresh_field("net_total");
}

//Update Deductions with Forecast Projection Number "After Save"
function update_deduction_number(frm) {
    frm.doc.in_deductions.forEach(function (child) {
        frappe.model.set_value(child.doctype, child.name, 'forecast_projection', frm.doc.name);
    });
    frm.doc.out_deductions.forEach(function (child) {
        frappe.model.set_value(child.doctype, child.name, 'forecast_projection', frm.doc.name);
    });
}