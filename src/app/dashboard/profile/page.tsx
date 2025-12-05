
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Upload, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraDialogOpen, setIsCameraDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [username, setUsername] = useState("johndoe");
  const [email, setEmail] = useState("johndoe@example.com");

  useEffect(() => {
    // This effect handles camera cleanup when the dialog is closed.
    let stream: MediaStream | null = null;
    if (videoRef.current && videoRef.current.srcObject) {
      stream = videoRef.current.srcObject as MediaStream;
    }

    const user = localStorage.getItem("user");
    if (user) {
        const userData = JSON.parse(user);
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        setEmail(userData.email);
        setUsername(userData.email.split('@')[0]);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraDialogOpen]);

  const getCameraPermission = async () => {
    // Reset state each time we open the dialog
    setHasCameraPermission(null); 
    
    // Stop any existing stream before requesting a new one
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setProfileImage(dataUrl);
        toast({
          title: 'Photo Captured!',
          description: 'Your new profile picture has been set.',
        });
      }
      // Stop the camera stream after capture
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraDialogOpen(false); // Close the dialog
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        toast({
            title: "Image Uploaded",
            description: "Your profile picture has been updated."
        })
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Profile Setting</h1>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Manage your personal and account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Profile Picture Section */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <Avatar className="w-32 h-32 text-muted-foreground border">
              <AvatarImage src={profileImage || undefined} alt="Profile Picture" />
              <AvatarFallback>
                <UserIcon className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4"/> Upload
                            <input id="file-upload" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                        </label>
                    </Button>
                     <AlertDialog open={isCameraDialogOpen} onOpenChange={setIsCameraDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button onClick={() => { setIsCameraDialogOpen(true); getCameraPermission(); }}>
                                <Camera className="mr-2 h-4 w-4"/> Take Photo
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Take a Profile Photo</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Center your face in the frame and capture your photo.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="my-4">
                                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                                <canvas ref={canvasRef} className="hidden"></canvas>
                                {hasCameraPermission === false && (
                                     <Alert variant="destructive" className="mt-4">
                                        <AlertTitle>Camera Access Required</AlertTitle>
                                        <AlertDescription>
                                            Please allow camera access in your browser to use this feature.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleCapture} disabled={hasCameraPermission !== true}>
                                    Capture & Save
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>
          
          {/* Form Section */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue="+1234567890" />
                </div>
                 <div className="md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} disabled />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue="123 Main St" />
                </div>
                <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" defaultValue="Anytown" />
                </div>
                <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" defaultValue="CA" />
                </div>
                 <div>
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" defaultValue="USA" />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
