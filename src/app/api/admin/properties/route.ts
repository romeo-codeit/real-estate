import { NextRequest, NextResponse } from 'next/server';
import { createProperty, updateProperty, deleteProperty } from '@/services/sanity/properties.sanity';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';

// POST /api/admin/properties - Create new property
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'admin_properties_post');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await import('@/services/supabase/supabase-admin').then(m => m.supabaseAdmin.auth.getUser(token));
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await import('@/services/supabase/supabase-admin').then(m => m.supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single());

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();

    // Parse form data
    const propertyData = {
      title: formData.get('title') as string,
      price: parseFloat(formData.get('price') as string),
      address: formData.get('address') as string,
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      area: parseInt(formData.get('area') as string),
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      featured: formData.get('featured') === 'true',
      amenities: formData.getAll('amenities[]') as string[],
      mainImage: formData.get('mainImage') as File,
      galleryImages: formData.getAll('galleryImages') as File[],
    };

    const newProperty = await createProperty(propertyData);

    // Log audit event
    await auditService.logAuditEvent(
      user.id,
      'property_create',
      'property',
      newProperty._id,
      {
        title: propertyData.title,
        price: propertyData.price,
        type: propertyData.type,
        featured: propertyData.featured,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ property: newProperty }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/properties/[id] - Update property
export async function PUT(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'admin_properties_put');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();

    // Parse form data
    const propertyData = {
      title: formData.get('title') as string,
      price: parseFloat(formData.get('price') as string),
      address: formData.get('address') as string,
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      area: parseInt(formData.get('area') as string),
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      featured: formData.get('featured') === 'true',
      amenities: formData.getAll('amenities[]') as string[],
      mainImage: formData.get('mainImage') as File,
      galleryImages: formData.getAll('galleryImages') as File[],
    };

    const id = formData.get('id') as string;

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const updatedProperty = await updateProperty(id, propertyData);

    // Log audit event
    await auditService.logAuditEvent(
      user.id,
      'property_update',
      'property',
      id,
      {
        title: propertyData.title,
        price: propertyData.price,
        type: propertyData.type,
        featured: propertyData.featured,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/[id] - Delete property
export async function DELETE(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_properties_delete');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await deleteProperty(id);

    // Log audit event
    await auditService.logAuditEvent(
      user.id,
      'property_delete',
      'property',
      id,
      {
        note: 'Property deleted by admin',
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}