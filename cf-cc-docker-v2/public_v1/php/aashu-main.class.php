<?php

Class AashuMain {

  private $configData;
  private $post;
  private $mailchimp = array(
    'apiKey' => 'MailchimpAPIKey',
    'listId' => 'MailchimpListID'
  );

  public function __construct($file, $post) {
    $strConfig = file_get_contents($file);
    $this->configData = json_decode($strConfig);
    $this->post = $this->sanitize($post);
  }

  private function sanitize($post = array()) {
    foreach ($post as $key => $val) {
      switch ($key) {
        case 'email':
          $post[$key] = filter_var($val, FILTER_SANITIZE_EMAIL);
          break;
        default:
          $post[$key] = filter_var($val, FILTER_SANITIZE_STRING);
      }
    }
    return $post;
  }

  public function subscribe() {
    $apiKey = $this->mailchimp['apiKey'];
    $listID = $this->mailchimp['listId'];
    $email = $this->post['email'];

    // MailChimp API URL
    $memberID = md5(strtolower($email));
    $dataCenter = substr($apiKey, strpos($apiKey, '-') + 1);
    $url = 'https://' . $dataCenter . '.api.mailchimp.com/3.0/lists/' . $listID . '/members/' . $memberID;

    // member information
    $json = json_encode([
      'email_address' => $email,
      'status' => 'subscribed',
    ]);

    // send a HTTP POST request with curl
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_USERPWD, 'user:' . $apiKey);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $message = '';
    $status = '';
    // store the status message based on response code
    if ($httpCode == 200) {
      $message = 'You have successfully subscribed to our website.';
      $status = 'success';
    }
    else {
      switch ($httpCode) {
        case 214:
          $message = 'You are already subscribed.';
          $status = 'warning';
          break;
        default:
          $message = 'Some problem occurred, please try again.';
          $status = 'danger';
          break;
      }
    }
    return json_encode(
        array('status' => $status, 'message' => $message)
    );
  }

  public function contact() {
    $post = $this->post;
    $subject = str_replace('{{ fullname }}', $post['fullname'], $this->configData->contactSubject);
    $mailMessage = str_replace(
        array('{{ fullname }}', '{{ message }}', '{{ email }}'), array($post['fullname'], $post['message'], $post['email']), $this->configData->contactMessage
    );
    $to = $this->configData->contactEmail;
    $headers = 'From: ' . $post['email'] . "\r\n";
    $message = 'Sorry, we could not send your message. Please try again later.';
    $status = 'danger';
    if (mail($to, $subject, $mailMessage, $headers)) {
      $message = 'Your message is sent successfully!';
      $status = 'success';
    }
    return json_encode(
        array('status' => $status, 'message' => $message)
    );
  }

}