export const TDMockHTMLPreview = {
  inputHtml: `<!DOCTYPE html>
<html>
<head>
  <title>HTML Preview Example</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f0f0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      text-align: center;
    }
    .content {
      line-height: 1.6;
      color: #34495e;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #2980b9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to HTML Preview</h1>
    <div class="content">
      <p>This is a sample HTML page demonstrating various HTML elements and CSS styling.</p>
      <p>Features demonstrated:</p>
      <ul>
        <li>Basic HTML structure</li>
        <li>CSS styling</li>
        <li>Responsive design</li>
        <li>Interactive elements</li>
      </ul>
      <p>Click the button below to see an alert:</p>
      <button class="btn" onclick="alert('Hello from HTML Preview!')">Click Me</button>
    </div>
  </div>
</body>
</html>`,
};
