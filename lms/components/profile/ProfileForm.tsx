"use client";

import { useActionState, useEffect } from "react";
import toast from "react-hot-toast";
import { updateProfileAction } from "@/app/student/profile/actions";
import { QualificationsField } from "@/components/profile/QualificationsField";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import type { Qualification } from "@/lib/validations/profile";

export type ProfileFormValues = {
  name: string;
  designation: string;
  department: string;
  organisation: string;
  postingLocation: string;
  phone: string;
  bio: string;
  yearsExperience: number;
  interests: string[];
  governmentIdType: string;
  governmentIdNum: string;
  resumeUrl: string;
  qualifications: Qualification[];
};

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialActionState);

  useEffect(() => {
    if (state?.success) toast.success("Profile saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>

      <form action={formAction} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="name" error={err("name")}>
            <Input id="name" name="name" defaultValue={profile.name} placeholder="e.g. Priya Sharma" />
          </FormField>
          <FormField label="Designation" htmlFor="designation" error={err("designation")}>
            <Input
              id="designation"
              name="designation"
              defaultValue={profile.designation}
              placeholder="e.g. Scientist-B"
            />
          </FormField>
          <FormField label="Department" htmlFor="department" error={err("department")}>
            <Input
              id="department"
              name="department"
              defaultValue={profile.department}
              placeholder="e.g. IMD"
            />
          </FormField>
          <FormField label="Organisation" htmlFor="organisation" error={err("organisation")}>
            <Input
              id="organisation"
              name="organisation"
              defaultValue={profile.organisation}
              placeholder="e.g. Ministry of Earth Sciences"
            />
          </FormField>
          <FormField label="Posting location" htmlFor="postingLocation" error={err("postingLocation")}>
            <Input
              id="postingLocation"
              name="postingLocation"
              defaultValue={profile.postingLocation}
              placeholder="e.g. New Delhi"
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={err("phone")}>
            <Input id="phone" name="phone" defaultValue={profile.phone} placeholder="e.g. +91 98xxxxxx" />
          </FormField>
        </div>

        <FormField label="Bio" htmlFor="bio" error={err("bio")}>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio}
            placeholder="A short professional summary (up to 600 characters)."
          />
        </FormField>

        <QualificationsField qualifications={profile.qualifications} error={err("qualifications")} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Years of experience" htmlFor="yearsExperience" error={err("yearsExperience")}>
            <Input
              id="yearsExperience"
              name="yearsExperience"
              type="number"
              min={0}
              max={50}
              step="0.5"
              defaultValue={profile.yearsExperience}
            />
          </FormField>
          <FormField label="Interests" htmlFor="interests" error={err("interests")}>
            <Input
              id="interests"
              name="interests"
              defaultValue={profile.interests.join(", ")}
              placeholder="Comma separated, e.g. NWP, Radar, Cyclones"
            />
          </FormField>
          <FormField label="Government ID type" htmlFor="governmentIdType" error={err("governmentIdType")}>
            <Input
              id="governmentIdType"
              name="governmentIdType"
              defaultValue={profile.governmentIdType}
              placeholder="e.g. Aadhaar, PAN"
            />
          </FormField>
          <FormField label="Government ID number" htmlFor="governmentIdNum" error={err("governmentIdNum")}>
            <Input
              id="governmentIdNum"
              name="governmentIdNum"
              defaultValue={profile.governmentIdNum}
              placeholder="Stored securely, shown masked"
            />
          </FormField>
        </div>

        <FormField label="Resume URL" htmlFor="resumeUrl" error={err("resumeUrl")}>
          <Input
            id="resumeUrl"
            name="resumeUrl"
            type="url"
            defaultValue={profile.resumeUrl}
            placeholder="https://..."
          />
        </FormField>

        <div className="flex justify-end pt-1">
          <Button type="submit" loading={pending}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
