// Function to trigger enrollment (run this once for your admin account)
import { multiFactor, TotpMultiFactorGenerator } from 'firebase/auth';
import QRCode from 'qrcode';

const enrollMFA = async (user) => {
    const multiFactorSession = await multiFactor(user).getSession();
    const secret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
    
    // 1. Generate QR Code URL
    const qrCodeUrl = await QRCode.toDataURL(secret.generateQrCodeUrl(user.email, 'SeshNx Admin'));
    console.log("Scan this QR:", qrCodeUrl); // Display this image to user
    
    // 2. Ask user for the code they see on their app
    const code = prompt("Enter code from Authenticator:");
    
    // 3. Finalize
    const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
    await multiFactor(user).enroll(multiFactorAssertion, "Admin Device");
    alert("MFA Enrolled!");
};
