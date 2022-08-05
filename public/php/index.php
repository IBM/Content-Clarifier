<?php
require_once 'aashu-main.class.php';
$_POST = $_POST = json_decode(file_get_contents('php://input'), true);
$aashuMain = new AashuMain('../data/page.json', $_POST);
print $aashuMain->$_GET['action']();
