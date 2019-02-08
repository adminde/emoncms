<?php
    global $user, $session;

    $domain = "messages";
    bindtextdomain($domain, "Modules/input/locale");
    bind_textdomain_codeset($domain, 'UTF-8');
    
    $view = $user->get_preferences($session['userid'], 'deviceView');
    if (isset($view) && $view) {
        $name = dgettext($domain, "Devices");
    }
    else {
        $name = dgettext($domain, "Inputs");
    }
    $menu_dropdown_config[] = array(
        'name'=>$name,
        'icon'=>'icon-arrow-right',
        'path'=>"input/view" ,
        'session'=>"write",
        'order'=>10
    );
