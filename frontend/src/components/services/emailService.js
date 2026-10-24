// services/emailService.js

// الطريقة 1: استخدام EmailJS (مجاني لحد 200 بريد يومياً)
export const sendEmail = async (formData) => {
  // يمكنك التسجيل في https://www.emailjs.com/ واستبدال هذه القيم
  const serviceID = 'service_0tjeujc';
  const templateID = 'template_6je3bmg';
  const userID = 'D4gWHO7C2DwqCOjwU';

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceID,
        template_id: templateID,
        user_id: userID,
        template_params: {
          from_name: formData.name,
          from_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          to_email: 'mostafaaltala84@mail.com'
        }
      })
    });

    if (response.ok) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('EmailJS error:', error);
    throw error;
  }
};

// الطريقة 2: استخدام خدمة Formspree (بديل مجاني)
export const sendEmailViaFormspree = async (formData) => {
  try {
    const response = await fetch('https://formspree.io/f/mvojnqkk', { // استبدل برابط Formspree الخاص بك
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        _replyto: formData.email
      })
    });

    if (response.ok) {
      return { success: true, message: 'Message sent successfully' };
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Formspree error:', error);
    throw error;
  }
};

// الطريقة 3: استخدام mailto كبديل (لا يتطلب backend)
export const sendEmailViaMailto = (formData) => {
  const subject = encodeURIComponent(formData.subject);
  const body = encodeURIComponent(
    `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
  );
  
  const mailtoLink = `mailto:mostafaaltala84@mail.com?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
  
  return { success: true, message: 'Email client opened' };
};

// الدالة الرئيسية التي سنستخدمها
export const sendContactEmail = async (formData) => {
  try {
    // حاول أولاً استخدام EmailJS
    return await sendEmail(formData);
  } catch (error) {
    console.log('Failed...');
    alert('Failed...')
  }
};