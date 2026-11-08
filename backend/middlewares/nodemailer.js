const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'floy.leffler@ethereal.email',
        pass: 'dUwWPr9ZH8pYa33Y2V'
    }
});

let message = await transporter.sendMail({
    from: '"Cellutech 🙂" <floy.leffler@ethereal.email>', 
    to: "ousmanseid@gmail.com, faysalali@gmail.com", 
    subject: "Hello guys ✔", 
    text: "Some shitty text", 
    html: "<b>Hello world?</b>",
});

transporter.sendMail(message, (error, info) => {
    if (error) {
        console.log('Error occurred');
        console.log(error.message);
        return process.exit(1);
    }

    console.log('Message sent successfully!');
    console.log(nodemailer.getTestMessageUrl(info));

    // only needed when using pooled connections
    transporter.close();
});