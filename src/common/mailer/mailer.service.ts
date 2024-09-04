//welcome

// otp for 2fa

// reset password token

// confirmation of other and sending tracking number

// when an order is completed
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class Mailer {
  constructor(private readonly mailerservice: MailerService) {}


  async updatePasscodeMail(
    email: string,
    name: string,
    passcode:string
  ): Promise<void> {
    const subject = 'Passcode Update for CEO of The OstraLogistics';
    const content = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Two Factor Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          color: #333333;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo img {
          max-width: 150px;
        }
        .heading {
          text-align: center;
          color: black;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .message {
          font-size: 16px;
          margin-bottom: 20px;
          text-align: center;
        }
        .otp {
          text-align: center;
          font-size: 30px;
          color: #black;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #777777;
        }
        .social-icons {
          margin-top: 10px;
        }
        .social-icons img {
          width: 30px;
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="ostralogistics">
        </div>
        <h1 class="heading">Dear ${name},</h1>
        <p class="message">Your new passcode for extremely sensitive and secured operations within the admin dashboard as a CEO is:</p>
        <p class="otp">${passcode}</p>
        <p class="message">. If you did not request for this passcode Update, please ignore this email.</p>
        <p class="footer">ostralogistics</p>
        <div class="social-icons">
        <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
        <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
        <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
        <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
      </div>
      </div>
    </body>
    </html>
      `;

    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  async SendVerificationeMail(
    email: string,
    name: string,
    otpCode: string,
    expires: Date,
  ): Promise<void> {
    const subject = 'Two factor Verification for Ostra logistics';
    const content = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Verification - Verification Linke</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f2f2f2;
            color: #333333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 10px;
          }
          .verification-heading {
            text-align: center;
            color: #53B1FD;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .message {
            text-align: center;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .otp {
            text-align: center;
            font-size: 30px;
            color: #53B1FD;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .instructions {
            font-size: 16px;
            line-height: 1.4;
            margin-bottom: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #777777;
          }
          .social-icons {
            margin-top: 10px;
          }
          .social-icons img {
            width: 30px;
            margin: 0 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
          </div>
          <h1 class="verification-heading">Dear ${name},</h1>
          <p class="message">Your one-time password (OTP) for verification is:</p>
          <p class="otp">${otpCode}</p>
          <p class="message">This OTP is valid for a single use and expires in ${expires} minutes. If you did not request this OTP, please ignore this email.</p>
          <div class="footer">
            <p>Ostra Logistics</p>
            <div class="social-icons">
              <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
              <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
              <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
              <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
            </div>
          </div>
        </div>
      </body>
    </html>`;
    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  

  async SendPasswordResetLinkMail(
    email: string,
    resettoken: string,
    name: string,
  ): Promise<void> {
    const subject = 'Password Reset Token';
    const content = `<!DOCTYPE html>
      <html>
        <head>
          <title>Forgot Password Reset Token</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f2f2;
              color: #333333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 10px;
            }
            .verification-heading {
              text-align: center;
              color: #53B1FD;
              font-size: 20px;
              margin-bottom: 10px;
            }
            .message {
              text-align: center;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .otp {
              text-align: center;
              font-size: 30px;
              color: #53B1FD;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .instructions {
              font-size: 16px;
              line-height: 1.4;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #777777;
            }
            .social-icons {
              margin-top: 10px;
            }
            .social-icons img {
              width: 30px;
              margin: 0 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
            </div>
            <h1 class="verification-heading">Password Reset Request</h1>
            <p class="message">Hi ${name},</p>
            <div class="instructions">
              <p>It seems like you requested a password reset. Please use the OTP below to reset your password:</p>
              <p class="otp">${resettoken}</p>
              <p>If you did not request a password reset token, please ignore this email. This OTP will expire in 1 Hour.</p>
            </div>
            <div class="footer">
              <p>Ostra Logistics</p>
              <div class="social-icons">
                <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
                <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
                <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
                <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
              </div>
            </div>
          </div>
        </body>
      </html>`;
    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  

  async WelcomeMail(email: string, name: string): Promise<void> {
    const subject = 'Welcome To Ostra Logistics';
    const content = `<!DOCTYPE html>
      <html>
        <head>
          <title>Welcome to Ostra Logistics</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f2f2;
              color: #333333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 10px;
            }
            .verification-heading {
              text-align: center;
              color: #53B1FD;
              font-size: 20px;
              margin-bottom: 10px;
            }
            .message {
              text-align: center;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .instructions {
              font-size: 16px;
              line-height: 1.4;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #777777;
            }
            .social-icons {
              margin-top: 10px;
            }
            .social-icons img {
              width: 30px;
              margin: 0 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
            </div>
            <h1 class="verification-heading">Welcome OnBoard!</h1>
            <p class="message">Hi ${name},</p>
            <div class="instructions">
              <p>We are thrilled to have you join our platform. With Ostra Logistics, you can easily manage your deliveries, track orders in real-time, and more.</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>Happy delivering!</p>
              <p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">support@ostralogistics.com</a></p>
            </div>
            <div class="footer">
              <p>Ostra Logistics</p>
              <div class="social-icons">
                <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
                <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
                <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
                <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
              </div>
            </div>
          </div>
        </body>
      </html>`;
    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  
  async WelcomeMailAdmin(email: string, name: string): Promise<void> {
    const subject = 'Welcome To Ostra Logistics';
    const content = `<!DOCTYPE html>
      <html>
        <head>
          <title>Welcome to Ostra Logistics</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f2f2f2;
              color: #333333;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .logo {
              text-align: center;
              margin-bottom: 10px;
            }
            .verification-heading {
              text-align: center;
              color: #53B1FD;
              font-size: 20px;
              margin-bottom: 10px;
            }
            .message {
              text-align: center;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .instructions {
              font-size: 16px;
              line-height: 1.4;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #777777;
            }
            .social-icons {
              margin-top: 10px;
            }
            .social-icons img {
              width: 30px;
              margin: 0 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
            </div>
            <h1 class="verification-heading">Welcome OnBoard!</h1>
            <p class="message">Hi ${name},</p>
            <div class="instructions">
              <p>We are thrilled to have you join our platform. With Ostra Logistics, you can easily manage your deliveries, track orders in real-time, and more.</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>Happy delivering!</p>
              <p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">support@ostralogistics.com</a></p>
            </div>
            <div class="footer">
              <p>Ostra Logistics</p>
              <div class="social-icons">
                <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
                <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
                <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
                <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
              </div>
            </div>
          </div>
        </body>
      </html>`;
    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  

  async OrderAcceptedMail(
    email: string,
    name: string,
    trackingID: string,
    dropoffcode: string,
    ORDER_ID: string,
  ): Promise<void> {
    const subject = 'Order Details From Ostra Logistics';
    const content = `<!DOCTYPE html>
  <html>
    <head>
      <title>order accepted and payment made</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          color: #333333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 10px;
        }
        .verification-heading {
          text-align: center;
          color: #0293D2;
          font-size: 20px;
          margin-bottom: 10px;
        }
        .message {
          text-align: center;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .otp {
          text-align: center;
          font-size: 30px;
          color: #0293D2;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .instructions {
          font-size: 16px;
          line-height: 1.4;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #0293D2;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #777777;
        }
        .social-icons {
          margin-top: 10px;
        }
        .social-icons img {
          width: 30px;
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
        <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
        </div>
          
        <h1 class="verification-heading">Order Details!</h1>
        <p class="message"><span class="username">HI ${name}</span>,</p>
        
        <div class="instructions">
        <p>We are excited to inform you that your bid has been accepted and payment has been successfully made for order ID: ${ORDER_ID}.</p>
<p>A tracking ID has been generated for your order, and a drop-off code has also been provided. Please use the following details:</p>
<p>Tracking ID: ${trackingID}</p>
<p>Drop-off Code: ${dropoffcode}</p>
<p>Thank you for choosing Ostra Logistics. Happy delivering!</p>
          
          <p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">info@ostralogistics.com</a></p>
          
        </div>
        <div class="footer">
        <p>Ostra Logistics</p>
        <div class="social-icons">
          <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
          <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
          <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
          <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
        </div>
      </div>
    </body>
  </html>
  `;

    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }

  async OrderRecipientDropOffMail(
    email: string,
    name: string,
    dropoffcode: string,
    ORDER_ID: string,
  ): Promise<void> {
    const subject = 'Order Details From Ostra Logistics';
    const content = `<!DOCTYPE html>
  <html>
    <head>
      <title>order accepted and payment made</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          color: #333333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 10px;
        }
        .verification-heading {
          text-align: center;
          color: #0293D2;
          font-size: 20px;
          margin-bottom: 10px;
        }
        .message {
          text-align: center;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .otp {
          text-align: center;
          font-size: 30px;
          color: #0293D2;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .instructions {
          font-size: 16px;
          line-height: 1.4;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #0293D2;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #777777;
        }
        .social-icons {
          margin-top: 10px;
        }
        .social-icons img {
          width: 30px;
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
        <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
        </div>
          
        <h1 class="verification-heading">Order Details!</h1>
        <p class="message"><span class="username">HI ${name}</span>,</p>
        
        <div class="instructions">
        <p>We are excited to inform you that your bid has been accepted and payment has been successfully made for order ID: ${ORDER_ID}.</p>
<p> A drop-off code has been provided. Please use the following details:</p>

<p>Drop-off Code: ${dropoffcode}</p>
<p>Thank you for choosing Ostra Logistics. Happy delivering!</p>
          
          <p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">info@ostralogistics.com</a></p>
          
        </div>
        <div class="footer">
        <p>Ostra Logistics</p>
        <div class="social-icons">
          <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
          <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
          <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
          <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
        </div>
      </div>
    </body>
  </html>
  `;

    await this.mailerservice.sendMail({ to: email, subject, html: content });
  }
  async ParcelDroppedOfMail(
    email: string,
    name: string,
    trackingID: string,
  ): Promise<void> {
    const subject = 'Parcel DropOff Confirmation By Ostra Logistics';
    const content = `<!DOCTYPE html>
  <html>
    <head>
      <title>trip ended by our rider</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f2f2f2;
          color: #333333;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 10px;
        }
        .verification-heading {
          text-align: center;
          color: #0293D2;
          font-size: 20px;
          margin-bottom: 10px;
        }
        .message {
          text-align: center;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .otp {
          text-align: center;
          font-size: 30px;
          color: #0293D2;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .instructions {
          font-size: 16px;
          line-height: 1.4;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #0293D2;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          color: #777777;
        }
        .social-icons {
          margin-top: 10px;
        }
        .social-icons img {
          width: 30px;
          margin: 0 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
        <img src="https://res.cloudinary.com/dma3njgsr/image/upload/v1720577913/oppc1paydigfmzkgdgc8.png" alt="Ostra Logistics">
        </div>
          
        <h1 class="verification-heading">The Trip has Successfully Ended!</h1>
        <p class="message"><span class="username">HI ${name}</span>,</p>
        
        <div class="instructions">
        <p>We are pleased to confirm that your order with tracking ID: ${trackingID} has been successfully delivered.</p>
<p>If you have any feedback or concerns regarding your delivery experience, please don't hesitate to reach out to us.</p>
<p>Thank you for choosing Ostra Logistics.</p>

<p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">info@ostralogistics.com</a></p>
        </div>
        <div class="footer">
        <p>Ostra Logistics</p>
        <div class="social-icons">
          <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
          <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
          <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
          <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
        </div>
      </div>
    </body>
  </html>
  `;
  }

  async NewPasswordMail(
    email: string,
    name: string,
    password: string,
  ): Promise<void> {
    const subject = 'New Password';
    const content = `<!DOCTYPE html>
<html>
  <head>
    <title>new password for rider and staff</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f2f2f2;
        color: #333333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .logo {
        text-align: center;
        margin-bottom: 10px;
      }
      .verification-heading {
        text-align: center;
        color: #53B1FD;
        font-size: 20px;
        margin-bottom: 10px;
      }
      .message {
        text-align: center;
        font-size: 16px;
        margin-bottom: 20px;
      }
      .otp {
        text-align: center;
        font-size: 30px;
        color: #0293D2;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .instructions {
        font-size: 16px;
        line-height: 1.4;
      }
      .button {
        display: inline-block;
        padding: 10px 20px;
        background-color: #0293D2;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #777777;
      }
      .social-icons {
        margin-top: 10px;
      }
      .social-icons img {
        width: 30px;
        margin: 0 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
      <h1> OSTRA LOGISTICS </h1>
      </div>
        
      <h1 class="verification-heading">New Password For Ostra Logistics!</h1>
      <p class="message"><span class="username">Dear ${name}</span>,</p>
      
      <div class="instructions">
      <p>We hope this email finds you well.</p>
      <p>This is to inform you that a new password has been generated for your Ostra Logistics account. Please find your new login credentials below:</p>
      <p><strong>Username:</strong> ${name}<br>
         <strong>New Password:</strong> ${password}</p>
      <p>For security reasons, If you did not request a new password or have any concerns, please contact our support team immediately.</p>
      <p>Thank you for choosing Ostra Logistics. We appreciate your continued partnership.</p>
      <p>Best regards,<br>>

      <p>For any questions or assistance, contact our support team at <a href="mailto:ostralogistics@gmail.com">support@ostralogistics.com</a></p>
      </div>
      <div class="footer">
      <p>Ostra Logistics</p>
      <div class="social-icons">
        <a href="https://facebook.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/facebook-new.png" alt="Facebook"></a>
        <a href="https://twitter.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/twitter.png" alt="Twitter"></a>
        <a href="https://instagram.com/ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/instagram-new.png" alt="Instagram"></a>
        <a href="https://tiktok.com/@ostralogistics"><img src="https://img.icons8.com/fluent/48/000000/tiktok.png" alt="TikTok"></a>
      </div>
    </div>
  </body>
</html>
`;
  }
}
