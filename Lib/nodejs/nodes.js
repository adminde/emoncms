/*
  nodes.js is released under the GNU Affero General Public License.
  See COPYRIGHT.txt and LICENSE.txt.

  Part of the OpenEnergyMonitor project: http://openenergymonitor.org
  Developed by: Adrian Minde  adrian_minde@live.de
*/
var nodes = {
    container: null,
    hover: false,

    actions: {},
    header: {},
    body: {},
    empty: 'No items configured yet.',

    itemSize: 0,
    items: {},
    groups: {},

    selected: {},
    collapsed: {},

    cookie: 'nodes_cache',

    init: function(container) {
        if (!container) {
            alert('Actions container has to be loaded to valid element');
            return false;
        }
        nodes.container = container;
        
        nodes.hover = false;
        $(document).on('mousemove', function() {
            $(document).off('mousemove');
            nodes.hover = true;
        });
        
        if (typeof cookies !== 'undefined' && typeof cookies.get === 'function' &&
        		cookies.contains(nodes.cookie+'_collapsed')) {
        	nodes.collapsed = JSON.parse(cookies.get(nodes.cookie+'_collapsed'));
        }
        
        var actions = "";
        for (let id in nodes.actions) {
            let action = nodes.actions[id];
            
            if (typeof action.type === 'undefined') {
                continue;
            }
            else if (action.type == 'select') {
                actions += "<div id='node-action-select-all' class='node-select' title='Select all'>" +
                        "<input class='select' type='checkbox'></input>" +
                        "<span><i>Select all</i></span>" +
                    "</div>";
            }
            else if (action.type == 'expand') {
                actions += "<div id='node-action-expand-all' class='action' title='Expand' data-type='expand' data-expand='false'>" +
                        "<span class='icon icon-resize-full'></span>" +
                    "</div>";

            }
            else if (action.type == 'filler') {
                actions += "<div class='filler'></div>";
            }
            else if (action.type == 'icon') {
                actions += nodes.drawIcon('node-action', id, action);
            }
        }
        container.html(
            "<div class='node-actions' data-spy='affix' data-offset-top='100'>" +
                "<div class='node-item'>" +
                    actions +
                "</div>" +
            "</div>" +
            "<div class='node-container'></div>"
        );
        nodes.registerActionEvents();
    },

    update: function() {
        let time = {};
        for (let id in nodes.body) {
            let config = nodes.body[id];
            if (config.type == 'time') {
                for (let i in items) {
                    let t = typeof data[id] !== 'undefined' ? data[id] : null;
                    $(nodes.formatId('item', items[i])+'-'+id, nodes.container)
                        .html(nodes.formatTime(t));
                }
            }
        }
        for (let id in nodes.header) {
            let config = nodes.header[id];
            if (config.type == 'time') {
//                status = nodes.getNodeStatus(id, items);
//                let time = nodes.drawTime(divid, id, config, items, true);
            }
        }
    },

    draw: function(data, callback) {
        $('.node-container', nodes.container).empty();
        nodes.groups = {};
        nodes.items = {};
        nodes.itemSize = 0;
        
        if (Array.isArray(data.items)) {
            for (let id in data.items) {
                let item = data.items[id];
                let nodeid = item[nodes.id];
                if (!items.hasOwnProperty(nodeid)) items[nodeid] = {};
                nodes.items[nodeid][item.id] = item;
            }
        }
        else {
            nodes.items = data.items;
        }
        for (let id in data.nodes) {
            let node = data.nodes[id];
            let nodeid = Array.isArray(data.nodes) ? node.id : id;
            let items = nodes.items[nodeid];
            nodes.itemSize += Object.keys(items).length;
            nodes.groups[nodeid] = node;
            
            nodes.drawNode(node, items);
        }
        nodes.drawActions();
        nodes.registerNodeEvents();
        
        if (typeof callback === 'function') {
            callback();
        }
    },

    drawNode: function(node, items) {
        let divid = nodes.formatId('node', node.id);
        let status = "";
        let header = "";
        let body = "";
        
        if (!nodes.collapsed.hasOwnProperty(node.id)) nodes.collapsed[node.id] = true;
        if (!nodes.selected.hasOwnProperty(node.id)) nodes.selected[node.id] = [];
        
        for (let id in items) body += nodes.drawItem(node.id, items[id]);
        for (let id in nodes.header) {
            let config = nodes.header[id];
            
            if (typeof config.type === 'undefined') {
                continue;
            }
            else if (config.type == 'select') {
                let checked = Object.keys(nodes.selected[node.id]).length > 0 ? 'checked' : '';
                header += "<div class='node-collapse'>" +
                        "<span id='"+divid+"-icon' class='icon-chevron-"+(nodes.collapsed[node.id] ? 'right' : 'down')+" icon-collapse'></span>" +
                        "<input id='"+divid+"-select' class='select hide' type='checkbox' "+checked+"></input>" +
                    "</div>";
            }
            else if (config.type == 'filler') {
                header += "<div class='filler'></div>";
            }
            else if (config.type == 'text') {
                header += nodes.drawText(divid, id, config, node);
            }
            else if (config.type == 'time') {
                status = nodes.getNodeStatus(id, items);
                header += nodes.drawTime(divid, id, config, items, true);
            }
            else if (config.type == 'icon') {
                header += nodes.drawIcon(divid, id, config);
            }
        }
        if (body.length == 0) {
            body = "<div id='"+divid+"-none' class='alert'>"+nodes.empty+"</div>";
        }
        
        $('.node-container', nodes.container).append(
            "<div class='node' data-id='"+node.id+"'>" +
                "<div id='"+divid+"-header' class='node-header' data-toggle='collapse' data-target='#"+divid+"-body'>" +
                    "<div class='node-item "+status+"'>" +
                        header +
                    "</div>" +
                "</div>" +
                "<div id='"+divid+"-body' class='node-body collapse "+(nodes.collapsed[node.id] ? '' : 'in')+"'>" +
                    body +
                "</div>" +
            "</div>"
        );
        let checked = nodes.selected[node.id].length;
        if (checked > 0 && checked < Object.keys(items).length) {
            $('#'+divid+'-select').prop('indeterminate', true);
        }
    },

    drawItem: function(nodeid, item) {
        let divid = nodes.formatId('item', item.id);
        var status = "";
        var html = "";
        
        for (let id in nodes.body) {
            let config = nodes.body[id];
            
            if (typeof config.type === 'undefined') {
                continue;
            }
            else if (config.type == 'select') {
                let checked = nodes.selected[nodeid].indexOf(item.id) >= 0 ? 'checked' : '';
                html += "<div class='node-select'>" +
                        "<input id='"+divid+"-select' class='select' type='checkbox' "+checked+"></input>" +
                    "</div>";
            }
            else if (config.type == 'filler') {
                html += "<div class='filler'></div>";
            }
            else if (config.type == 'text') {
                html += nodes.drawText(divid, id, config, item);
            }
            else if (config.type == 'time') {
                status = nodes.getItemStatus(id, item);
                html += nodes.drawTime(divid, id, config, item);
            }
            else if (config.type == 'icon') {
                html += nodes.drawIcon(divid, id, config);
            }
        }
        return "<div id='"+divid+"-item' class='node-item "+status+"' data-id='"+item.id+"'>"+html+"</div>";
    },

    drawText: function(divid, id, config, data) {
        let title = (typeof config.title !== 'undefined') ? config.title : '';
        let type = (typeof config.class !== 'undefined') ? config.class : '';
        let text = "";
        if (typeof config.draw === 'function') {
            text = config.draw(data);
        }
        else if (typeof data[id] !== undefined) {
            text = data[id];
        }
        return "<div class='"+type+"' title='"+title+"'><span>"+text+"</span></div>";
    },

    drawTime: function(divid, id, config, data, node=false) {
        let title = (typeof config.title !== 'undefined') ? config.title : 'Update';
        let type = (typeof config.class !== 'undefined') ? config.class : '';
        let time = new Date().getTime();
        if (node) {
            for (let i in data) {
                if (typeof data[i][id] !== 'undefined') {
                    time = Math.min(time, data[i][id]);
                }
            }
        }
        else {
            time = typeof data[id] !== 'undefined' ? data[id] : null;
        }
        return "<div id='"+divid+"-time' class='"+type+"' title='"+title+"' data-type='"+id+"'>" +
                nodes.formatTime(time) +
            "</div>";
    },

    drawIcon: function(divid, id, config) {
        let title = (typeof config.title !== 'undefined') ? config.title : '';
        let hide = (typeof config.hide !== 'undefined') ? config.hide : false;
        let type = (typeof config.class !== 'undefined') ? config.class : '';
        let icon = (typeof config.icon !== 'undefined') ? config.icon : 'icon-question-sign';
        return "<div id='"+divid+"-"+id+"' class='action "+type+"' title='"+title+"' data-type='"+id+"' "+(hide ? 'style="display:none"' : '')+">" +
                "<span class='"+icon+"'></span>" +
            "</div>";
    },

    drawActions: function() {
        let count = 0;
        for (id in nodes.selected) count += nodes.selected[id].length;
        if (count == 0) {
            $('#node-action-select-all input').prop('checked', false).prop('indeterminate', false);
            $('#node-action-delete').hide();
        }
        else {
            if (count < nodes.itemSize) {
                $('#node-action-select-all input').prop('checked', false).prop('indeterminate', true);
                $('#node-action-delete').show();
            }
            else {
                $('#node-action-select-all input').prop('checked', true).prop('indeterminate', false);
                $('#node-action-delete').show();
            }
            nodes.showActions(true);
        }
    },

    showActions: function(show) {
        for (let id in nodes.actions) {
            let action = nodes.actions[id];
            if (typeof action.hide !== 'undefined' && action.hide) {
                if (show) {
                    $('#node-action-'+id).show();
                }
                else {
                    $('#node-action-'+id).hide();
                }
            }
        }
    },

    selectAll: function(state) {
        for (let nodeid in nodes.items) {
            let id = nodes.formatId('node', nodeid);
            if (state && !$('#'+id+'-body').hasClass('in')) {
                $('#'+id+'-body').collapse('show');
            }
            $('#'+id+'-select').prop('checked', state).prop('indeterminate', false);
            
            nodes.selected[nodeid] = [];
            for (let itemid in nodes.items[nodeid]) {
                let item = nodes.items[nodeid][itemid];
                if (state) {
                    nodes.selected[nodeid].push(item.id);
                }
                $('#'+nodes.formatId('item', item.id)+'-select').prop('checked', state);
            }
        }
        nodes.showActions(state);
    },

    selectNode: function(nodeid, state) {
        nodes.selected[nodeid] = [];
        for (let itemid in nodes.items[nodeid]) {
            let item = nodes.items[nodeid][itemid];
            if (state) {
                nodes.selected[nodeid].push(item.id);
            }
            $('#'+nodes.formatId('item', item.id)+'-select').prop('checked', state);
        }
        
        let divid = nodes.formatId('node', nodeid);
        if (state) {
            $('#'+divid+'-select').prop('indeterminate', false);
            if (!$('#'+divid+'-collapse').hasClass('in')) {
                $('#'+divid+'-collapse').collapse('show');
            }
        }
        nodes.drawActions();
    },

    selectItem: function(nodeid, itemid, state) {
        let item = nodes.items[nodeid][itemid];
        let index = nodes.selected[nodeid].indexOf(item.id);
        if (index >= 0 && !state) {
            nodes.selected[nodeid].splice(index, 1);
        }
        else if (index < 0 && state) {
            nodes.selected[nodeid].push(item.id);
        }
        
        let select = $('#'+nodes.formatId('node', nodeid)+'-select');
        let count = nodes.selected[nodeid].length;
        if (count == null) {
            select.prop('checked', false).prop('indeterminate', false);
        }
        else if (count == Object.keys(nodes.items[nodeid]).length) {
            select.prop('checked', true).prop('indeterminate', false);
        }
        else {
            select.prop('checked', true).prop('indeterminate', true);
        }
        nodes.drawActions();
    },

    expand: function(state) {
        var expand = $('#node-action-expand-all', nodes.container);
        
        // Set the icon and button title based on the state (true == expanded)
        expand.find('.icon')
          .toggleClass('icon-resize-small', state)
          .toggleClass('icon-resize-full', !state);
        
        expand.data('expand', state);
        expand.prop('title', state ? 'Collapse' : 'Expand');
        
        if (typeof cookies !== 'undefined' && typeof cookies.set === 'function') {
        	if (nodes.expandTimeout != null) {
                clearTimeout(nodes.expandTimeout);
        	}
        	// Debounce the call to save the current state to a local storage cookie
        	nodes.expandTimeout = setTimeout(function() {
                cookies.set(nodes.cookie+'_collapsed', JSON.stringify(nodes.collapsed))
            }, 100)
        }
    },

    expandAll: function(state) {
        nodes.expand(state);
        for (id in nodes.collapsed) {
            var node = $('#'+nodes.formatId('node', id)+'-body', nodes.container);
            if (state != node.hasClass('in')) {
                node.collapse(state ? 'show':'hide');
                nodes.collapsed[id] = !state;
            }
        }
    },

    formatId: function(type, id) {
        return (type + (isNaN(id)?'-':'') + id).toLowerCase().replace(/[_.:/]/g, '-');
    },

    formatTime: function(time) {
        var elapsed = nodes.getElapsedTime(time);
        var secs = Math.abs(elapsed);
        var mins = secs / 60;
        var hour = secs / 3600;
        var day = hour / 24;
        
        var updated = secs.toFixed(0) + "s";
        if ((update == 0) || (!$.isNumeric(secs))) updated = "loading";
        else if (secs.toFixed(0) == 0) updated = "now";
        else if (day > 7 && elapsed > 0) updated = "inactive";
        else if (day > 2) updated = day.toFixed(1) + " days";
        else if (hour > 2) updated = hour.toFixed(0) + " hrs";
        else if (secs > 180) updated = mins.toFixed(0) + " mins";
        
        return "<span class='item-update'>"+updated+"</span>";
    },

    /**
     * Get the CSS class name for a set of node items. Returnes the class based on 
     * the highest number of missed intervals, if an interval is configured.
     * Otherwise based on the furthest elapsed time since the last update.
     * 
     * @param {array} - array of items
     * @return {string} 
     */
    getNodeStatus: function(id, items) {
        var status = 'status-danger';
        var elapsed = -31536000; // Use one year in the future as error threshold
        var missed = 0;
        var now = new Date().getTime();
        for (i in items) {
            var item = items[i];
            if (!item[id]) {
                continue;
            }
            
            let e = (now - new Date(item[id]*1000).getTime())/1000;
            if (e > 0 && typeof item.interval !== 'undefined' && item.interval > 1) {
                missed = Math.max(missed, parseInt(e/item.interval));
            }
            elapsed = Math.max(elapsed, e);
        }
        if (missed > 0) {
            status = nodes.getMissedStatus(missed);
        }
        else if (elapsed > -31536000) {
            status = nodes.getElapsedStatus(elapsed);
        }
        return status;
    },

    /**
     * Get the CSS class name based on the number of missed intervals, if an interval
     * is configured. Otherwise based on the elapsed time since the last update.
     * 
     * @param {object} item
     * @return string
     */
    getItemStatus: function(id, item) {
        var status = 'status-danger';
        if (!item || !item[id]) {
            return status;
        }
        
        var elapsed = nodes.getElapsedTime(item[id]);
        if (elapsed > 0 && typeof item.interval !== 'undefined' && item.interval > 1) {
            status = nodes.getMissedStatus(parseInt(elapsed/item.interval));
        }
        else {
            status = nodes.getElapsedStatus(elapsed);
        }
        return status;
    },

    /**
     * Returns the CSS class name based on the number of missed intervals.
     * 
     * @param integer missed: number of missed intervals since last update
     * @return string
     */
    getMissedStatus: function(missed) {
        var status;
        if (missed < 5) {
            status = 'status-success'; 
        }
        else if (missed < 12) {
            status = 'status-warning';
        }
        else {
            status = 'status-danger';
        }
        return status;
    },

    /**
     * Returns the css class name based on the elapsed time since the last update.
     * 
     * @param integer elapsed: elapsed time since last update in seconds
     * @return string
     */
    getElapsedStatus: function(elapsed) {
        var status;
        var secs = Math.abs(elapsed);
        if (elapsed < 0) {
            status = 'status-info'; 
        }
        else if (secs < 900) {
            status = 'status-success'; 
        }
        else if (secs < 7200) {
            status = 'status-warning';
        }
        else {
            status = 'status-danger';
        }
        return status;
    },

    /**
     * Returns the elapsed time in seconds since the item was updated.
     * 
     * @param integer time: unix timestamp of the item in seconds
     * @return integer
     */
    getElapsedTime: function(time) {
        return (new Date().getTime() - new Date(time*1000).getTime())/1000;
    },

    registerActionEvents: function() {
        $('.node-actions .node-select', nodes.container).on('click', function(e) {
            var state = $(this).find('input').prop('checked')
            if (state) {
                nodes.expandAll(state);
            }
            nodes.selectAll(state);
        });
        $('.node-actions .action', nodes.container).on('click', function(e) {
            var type = $(this).data('type');
            if (typeof type !== 'undefined') {
                if (type == 'expand') {
                    var expand = !$(this).data('expand');
                    nodes.expandAll(expand);
                }
            }
        });
    },

    registerNodeEvents: function() {
        $(".node-header .node-item").off('mouseover').on("mouseover", function(e) {
            var id = nodes.formatId('node', $(this).closest('.node').data('id'));
            $("#"+id+"-icon").hide();
            $("#"+id+"-select").show();
        });
        $(".node-header .node-item").off('mouseout').on("mouseout", function(e) {
            var id = nodes.formatId('node', $(this).closest('.node').data('id'));
            $("#"+id+"-icon").show();
            $("#"+id+"-select").hide();
        });
        $(".node-header .node-collapse input").off('click').on('click', function(e) {
            e.stopPropagation();
            
            var id = $(this).closest('.node').data('id');
            var state = $(this).prop('checked');
            
            nodes.selectNode(id, state);
        });
        $(".node-body .node-select input").off('click').on('click', function(e) {
            e.stopPropagation();
            
            var nodeid = $(this).closest('.node').data('id');
            var itemid = $(this).closest('.node-item').data('id');
            var state = $(this).prop('checked');
            
            nodes.selectItem(nodeid, itemid, state);
        });
        $(".node-body .node-item").off('click').on('click', function(e) {
            e.stopPropagation();
            
            var nodeid = $(this).closest('.node').data('id');
            var itemid = $(this).data('id');
            var select = $('#'+nodes.formatId('item', itemid)+'-select');
            var state = !select.prop('checked');
            
            select.prop('checked', state);
            nodes.selectItem(nodeid, itemid, state);
        });
        $(".collapse").off('show hide').on('show hide', function(e) {
            // Remember if the device block is collapsed, to redraw it correctly
            var id = $(this).attr('id').replace('-body', '');
            var collapse = $(this).hasClass('in');

            nodes.collapsed[$(this).closest('.node').data('id')] = collapse;
            if (collapse) {
                $("#"+id+"-icon").removeClass('icon-chevron-down').addClass('icon-chevron-right').show();
                $("#"+id+"-select").hide();
            }
            else {
                if (nodes.hover) {
                    $("#"+id+"-icon").removeClass('icon-chevron-right').addClass('icon-chevron-down');
                }
                else {
                    $("#"+id+"-icon").hide();
                    $("#"+id+"-select").show();
                }
            }
            
            var collapsed = 0;
            for (id in nodes.collapsed) {
                if (nodes.collapsed[id]) collapsed++;
            }
            nodes.expand(collapsed == 0);
        });
    }
}
