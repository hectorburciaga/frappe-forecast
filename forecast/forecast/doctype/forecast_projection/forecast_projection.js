// Copyright (c) 2025, Hector Burciaga and contributors
// For license information, please see license.txt

frappe.ui.form.on('Forecast Projection', {
    refresh: function(frm, cdt, cdn) {
        frm.add_custom_button(__("Get items from Sales Order"), function() {
            show_sord_dialog(frm);
        });
        update_totals(frm, cdt, cdn);
        update_net_total(frm);
        frm.add_custom_button(__("Get items from Purchase Order"), function() {
            show_pord_dialog(frm);
        });
        //get_total_invoiced();
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
   frappe.prompt([
        {
            'fieldname': 'sales_order',
            'fieldtype': 'Link',
            'label': 'Sales Order',
            'reqd': 1,
            'options': 'Sales Order',
            get_query() {
                return {
                    filters: {
                        "company": frm.doc.company,
                        "per_billed": ["<=", "99.99999"],
                    },
                };
            }
        }  
   ],
   function(sales_order){
      console.log(sales_order.sales_order);
      get_items_from_sord(sales_order.sales_order);
   },
   'Get items from sales order',
   'Get items'
  )
}

function get_items_from_sord(sales_order) {
  frappe.call({
    "method": "frappe.client.get",
    "args": {
        "doctype": "Sales Order",
        "name": sales_order,
    },
    "callback": function(response) {
         // add items to your child table
         var sinv = response.message;
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
        frm.doc.forecast_items.forEach(function(child) { total += child.amount; });
        frm.set_value("in_subtotal", total);
        refresh_field("in_subtotal");
}

/* function get_total_invoiced() {
    frappe.db.get_list('Sales Invoice Item', filters={sales_invoice: 'SAL-ORD-2025-00001'}, fields=['amount'])
    .then(r => {
    let values = r.message;
    console.log(values)
    })
} */

/* function get_total_invoiced() {
    frappe.db.get_value("Sales Invoice Item", {sales_invoice: 'SAL-ORD-2025-00001'}, "amount", function(value){
        frm.doc.amount = value.amount;
        console.log(value.amount);
    });
} */

/* function get_total_invoiced() {
    frappe.db.get_list('Sales Invoice Item', {
        filters: {
            sales_order: cur_frm.sales_order
        },
        fields: ['name', 'amount'],
        limit: 500,
    }).then(res => {
        console.log(res)
    }); */

    /* 
    }); */


/*     var sum = 0;
    var so = cur_frm.sales_order;
    doc.sales_invoice_item.forEach(function(sales_invoice_item){
        sum += sales_invoice_item === so ? item.amount : 0;
    });
    cur_frm.set_value("invoiced", sum);
    refresh_field("invoiced"); */
/// PURCHASE ORDERS *****

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
frappe.prompt([
    {
        'fieldname': 'purchase_order',
        'fieldtype': 'Link',
        'label': 'Purchase Order',
        'reqd': 1,
        'options': 'Purchase Order',
        get_query() {
            return {
                filters: {
                    "company": frm.doc.company,
                    "project": frm.doc.project,
                    "per_billed": ["<=", "99.99999"],
                },
            };
        }
    }  
],
function(purchase_order){
  console.log(purchase_order.purchase_order);
  get_items_from_pord(purchase_order.purchase_order);
},
'Get items from Purchase Order',
'Get items'
)
}

function get_items_from_pord(purchase_order) {
frappe.call({
"method": "frappe.client.get",
"args": {
    "doctype": "Purchase Order",
    "name": purchase_order,
},
"callback": function(response) {
     // add items to your child table
     var sinv = response.message;
     sinv.items.forEach(function (item) {
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
     cur_frm.set_value('purchase_order', sinv.name);
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