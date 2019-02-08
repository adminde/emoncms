<?php
    global $user, $session;

    $domain = "schedule_messages";
    bindtextdomain($domain, "Modules/schedule/locale");
    bind_textdomain_codeset($domain, 'UTF-8');

    $view = $user->get_preferences($session['userid'], 'deviceView');
    if (!isset($view) || !$view) {
        $menu_dropdown[] = array(
            'name'=> dgettext($domain, "Schedule"),
            'icon'=>'icon-time',
            'path'=>"schedule/view" ,
            'session'=>"write",
            'order' => 50
        );
    }
