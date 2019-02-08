<?php
    global $user, $session;

    $domain = "vis_messages";
    bindtextdomain($domain, "Modules/vis/locale");
    bind_textdomain_codeset($domain, 'UTF-8');

    $view = $user->get_preferences($session['userid'], 'deviceView');
    if (!isset($view) || !$view) {
        $menu_dropdown[] = array(
            'name'=> dgettext($domain, "Visualization"),
            'icon'=>'icon-tint',
            'path'=>"vis/list" ,
            'session'=>"write",
            'order' => 30
        );
    }
